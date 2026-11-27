"""Tâches planifiées du worker : exécution unique via verrou consultatif PostgreSQL (§12).

Chaque tâche est protégée par `pg_try_advisory_lock` sur une connexion dédiée.
Si un autre worker tient déjà le verrou, la tâche est ignorée silencieusement.
La connexion dédiée sert uniquement à la gestion du verrou et de `job_runs` ;
les opérations métier utilisent `session_scope()` (connexions du pool).
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession

from app.config import settings
from app.db import get_engine, session_scope
from app.domain.actors import Actor
from app.domain.audit import audit as write_audit
from app.domain.emails.outbox import enqueue_email
from app.domain.emails.outbox import reclaim_expired_leases as _reclaim_leases
from app.domain.settings.service import get_setting
from app.domain.webhooks import outbox as webhook_outbox
from app.domain.webhooks.outbox import build_send_headers
from app.domain.webhooks.sender import deliver as http_deliver
from app.models import Demande, DemandeEvent, WebhookDelivery, WebhookEndpoint
from app.timeutil import fmt_brussels, to_brussels, utcnow

log = structlog.get_logger("jobs")

BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Planification
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Schedule:
    """Intervalle fixe (interval) ou heure quotidienne à Bruxelles (daily_hour_brussels)."""

    interval: timedelta | None = None
    daily_hour_brussels: int | None = None


def _make_aware(dt: datetime) -> datetime:
    """Garantit que dt est timezone-aware (UTC si naïf)."""
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


async def is_due(conn: AsyncConnection, name: str, schedule: Schedule) -> bool:
    """Renvoie True si la tâche est due d'après job_runs et le planning."""
    row = (
        await conn.execute(
            text("SELECT last_started_at, last_finished_at FROM job_runs WHERE job = :n"),
            {"n": name},
        )
    ).mappings().first()

    now = utcnow()

    if schedule.interval is not None:
        last = _make_aware(row["last_started_at"]) if row and row["last_started_at"] else None
        return last is None or (now - last) >= schedule.interval

    if schedule.daily_hour_brussels is not None:
        now_bxl = to_brussels(now)
        today_run = now_bxl.replace(
            hour=schedule.daily_hour_brussels, minute=0, second=0, microsecond=0
        )
        today_run_utc = today_run.astimezone(UTC)
        if now < today_run_utc:
            return False
        last = _make_aware(row["last_finished_at"]) if row and row["last_finished_at"] else None
        return last is None or last < today_run_utc

    return True  # pas de planning = toujours dûe


async def mark_started(conn: AsyncConnection, name: str) -> None:
    """Enregistre le démarrage de la tâche dans job_runs."""
    await conn.execute(
        text("""
            INSERT INTO job_runs (job, last_started_at)
            VALUES (:name, now())
            ON CONFLICT (job) DO UPDATE SET last_started_at = now()
        """),
        {"name": name},
    )
    await conn.commit()


async def mark_finished(
    conn: AsyncConnection,
    name: str,
    status: str,
    processed: int,
    *,
    error: str | None = None,
) -> None:
    """Enregistre la fin de la tâche dans job_runs."""
    await conn.execute(
        text("""
            UPDATE job_runs
               SET last_finished_at = now(),
                   last_status      = :status,
                   last_error       = :error,
                   items_processed  = :processed
             WHERE job = :name
        """),
        {"name": name, "status": status, "error": error, "processed": processed},
    )
    await conn.commit()


async def run_job(
    name: str,
    schedule: Schedule,
    fn: Callable[[], Awaitable[int]],
) -> None:
    """Exécute fn() si la tâche est due et si aucun autre worker ne la traite déjà (§12.2).

    Utilise pg_try_advisory_lock (verrou de session) sur une connexion dédiée.
    La connexion est distincte du pool de sessions métier.
    """
    engine = get_engine()
    async with engine.connect() as conn:
        got_lock = await conn.scalar(
            text("SELECT pg_try_advisory_lock(hashtext(:n))"), {"n": name}
        )
        # Fermer la transaction autobegin ; le verrou de session persiste.
        await conn.commit()

        if not got_lock:
            log.debug("job.skipped_locked", job=name)
            return

        try:
            due = await is_due(conn, name, schedule)
            await conn.commit()

            if not due:
                log.debug("job.not_due", job=name)
                return

            await mark_started(conn, name)
            log.info("job.started", job=name)
            processed = await fn()
            await mark_finished(conn, name, "ok", processed)
            log.info("job.finished", job=name, processed=processed)

        except Exception as exc:
            try:
                await mark_finished(conn, name, "error", 0, error=type(exc).__name__)
            except Exception:  # noqa: BLE001
                log.warning("job.mark_finished_failed", job=name)
            log.exception("job.failed", job=name)
            raise
        finally:
            await conn.execute(text("SELECT pg_advisory_unlock(hashtext(:n))"), {"n": name})
            await conn.commit()


# ---------------------------------------------------------------------------
# Plannings
# ---------------------------------------------------------------------------

SCHEDULE_RECLAIM: Schedule = Schedule(interval=timedelta(minutes=1))
SCHEDULE_ALERT_STALE: Schedule = Schedule(interval=timedelta(minutes=5))
SCHEDULE_AUTO_CLOSE: Schedule = Schedule(interval=timedelta(hours=1))
SCHEDULE_RETENTION: Schedule = Schedule(daily_hour_brussels=3)
SCHEDULE_DAILY_DIGEST: Schedule = Schedule(daily_hour_brussels=8)
SCHEDULE_WEBHOOKS: Schedule = Schedule(interval=timedelta(seconds=15))


# ---------------------------------------------------------------------------
# Tâches
# ---------------------------------------------------------------------------


async def job_reclaim_expired_leases() -> int:
    """Remet en `pending` les e-mails dont le bail a expiré (§12.1)."""
    async with session_scope() as db:
        return await _reclaim_leases(db)


async def job_alert_stale_requests() -> int:
    """Envoie une alerte pour chaque demande `received` non traitée depuis trop longtemps.

    Une seule alerte par demande : le champ `stale_alerted_at` est positionné après l'envoi.
    """
    async with session_scope() as db:
        stale_minutes = int(await get_setting(db, "requests.stale_alert_minutes"))
        threshold = utcnow() - timedelta(minutes=stale_minutes)

        rows = (
            await db.execute(
                select(
                    Demande.id,
                    Demande.reference,
                    Demande.passenger_first_name,
                    Demande.passenger_last_name,
                    Demande.pickup_at,
                ).where(
                    Demande.status == "received",
                    Demande.created_at < threshold,
                    Demande.stale_alerted_at.is_(None),
                )
            )
        ).all()

        if not rows:
            return 0

        notification_emails: list[str] = await get_setting(db, "company.notification_emails")
        admin_link = settings.admin_url

        for row in rows:
            name = f"{row.passenger_first_name or ''} {row.passenger_last_name or ''}".strip()
            ctx: dict[str, Any] = {
                "ref": row.reference,
                "name": name or "—",
                "when": fmt_brussels(row.pickup_at),
                "minutes": stale_minutes,
                "link": f"{admin_link}/demandes/{row.id}",
            }
            for address in notification_emails:
                await enqueue_email(
                    db,
                    to=address,
                    template="demande_stale_alert",
                    language="fr",
                    context=ctx,
                )

        ids = [row.id for row in rows]
        await db.execute(
            update(Demande).where(Demande.id.in_(ids)).values(stale_alerted_at=utcnow())
        )

        return len(rows)


async def job_auto_close_demandes() -> int:
    """Clôture automatique des demandes confirmées dont l'heure de référence est dépassée (§5.5).

    - Aucun e-mail, aucun webhook.
    - Traitement par lots de 500, FOR UPDATE SKIP LOCKED.
    - Une ligne d'audit agrégée par lot.
    """
    # Lire les paramètres dans une transaction séparée (cache de 30 s).
    async with session_scope() as db:
        enabled: bool = await get_setting(db, "auto_close.enabled")
        delay_hours: int = int(await get_setting(db, "auto_close.delay_hours"))

    if not enabled:
        log.debug("auto_close.disabled")
        return 0

    actor = Actor.system()
    total = 0

    while True:
        async with session_scope() as db:
            result = await db.execute(
                text("""
                    WITH due AS (
                      SELECT id
                      FROM demandes
                      WHERE status = 'confirmed'
                        AND COALESCE(return_at, pickup_at)
                            + make_interval(hours => :delay_hours) <= now()
                      ORDER BY pickup_at
                      LIMIT :batch
                      FOR UPDATE SKIP LOCKED
                    )
                    UPDATE demandes AS d
                    SET status     = 'completed',
                        revision   = d.revision + 1,
                        closed_at  = now(),
                        closed_by  = 'system',
                        updated_at = now()
                    FROM due
                    WHERE d.id = due.id
                    RETURNING d.id, d.revision, d.reference
                """),
                {"delay_hours": delay_hours, "batch": BATCH_SIZE},
            )
            rows = result.all()

            if not rows:
                break

            # Une ligne DemandeEvent par demande clôturée.
            for row in rows:
                db.add(
                    DemandeEvent(
                        demande_id=row.id,
                        revision=row.revision,
                        type="status_changed",
                        from_status="confirmed",
                        to_status="completed",
                        actor_type="system",
                        actor_id=None,
                        reason="auto_close",
                    )
                )

            await db.flush()

            # Entrée d'audit agrégée.
            refs = [row.reference for row in rows]
            await write_audit(
                db,
                actor,
                "demande.auto_closed",
                details={"count": len(rows), "references": refs},
            )

            total += len(rows)
            log.info("auto_close.batch", closed=len(rows), total=total)

    return total


async def job_retention_purge() -> int:
    """Anonymisation et purge selon les durées de conservation (§4.4).

    - Anonymise les vieilles demandes et supprime leurs notes internes.
    - Anonymise les passagers inactifs.
    - Supprime les entrées anciennes du journal d'audit (via `app.audit_purge`).
    """
    async with session_scope() as db:
        demandes_months: int = int(await get_setting(db, "retention.demandes_months"))
        audit_months: int = int(await get_setting(db, "retention.audit_months"))
        passenger_months: int = int(await get_setting(db, "retention.inactive_passenger_months"))

    total = 0

    # 1. Anonymisation des demandes.
    async with session_scope() as db:
        result = await db.execute(
            text("""
                UPDATE demandes
                SET passenger_first_name  = '[anonymisé]',
                    passenger_last_name   = '[anonymisé]',
                    passenger_phone       = NULL,
                    passenger_email       = NULL,
                    pickup_address        = jsonb_build_object('formatted', '[anonymisé]'),
                    dropoff_address       = jsonb_build_object('formatted', '[anonymisé]'),
                    return_pickup_address = NULL,
                    pickup_instructions   = NULL,
                    needs                 = NULL,
                    health_consent_at     = NULL,
                    comment               = NULL,
                    refusal_reason        = NULL,
                    cancellation_reason   = NULL,
                    anonymized_at         = now()
                WHERE anonymized_at IS NULL
                  AND COALESCE(closed_at, pickup_at) < now() - make_interval(months => :months)
            """),
            {"months": demandes_months},
        )
        anonymized = result.rowcount or 0

        # Suppression des notes internes des demandes anonymisées.
        await db.execute(
            text("""
                DELETE FROM demande_notes
                WHERE demande_id IN (
                    SELECT id FROM demandes WHERE anonymized_at IS NOT NULL
                )
            """)
        )

        total += anonymized
        log.info("retention.demandes", anonymized=anonymized)

    # 2. Anonymisation des passagers inactifs.
    async with session_scope() as db:
        result = await db.execute(
            text("""
                UPDATE passengers
                SET email             = 'anon-' || id::text || '@deleted.invalid',
                    email_verified_at = NULL,
                    password_hash     = '[anonymisé]',
                    first_name        = '[anonymisé]',
                    last_name         = '[anonymisé]',
                    phone             = '[anonymisé]',
                    default_needs     = NULL,
                    health_consent_at = NULL,
                    status            = 'anonymized',
                    anonymized_at     = now(),
                    updated_at        = now()
                WHERE status NOT IN ('anonymized')
                  AND COALESCE(last_login_at, created_at) < now() - make_interval(months => :months)
            """),
            {"months": passenger_months},
        )
        anon_pass = result.rowcount or 0
        total += anon_pass
        log.info("retention.passengers", anonymized=anon_pass)

    # 3. Suppression des entrées anciennes du journal d'audit.
    #    Le trigger audit_log_guard autorise DELETE uniquement quand
    #    app.audit_purge = 'on' (SET LOCAL : valable pour la transaction).
    async with session_scope() as db:
        await db.execute(text("SET LOCAL \"app.audit_purge\" = 'on'"))
        result = await db.execute(
            text("DELETE FROM audit_log WHERE occurred_at < now() - make_interval(months => :months)"),
            {"months": audit_months},
        )
        purged = result.rowcount or 0
        total += purged
        log.info("retention.audit_log", deleted=purged)

    return total


async def job_deliver_webhooks() -> int:
    """Envoie les webhooks en attente (§8.5).

    1. Remet en `pending` les envois dont le bail a expiré.
    2. Réserve jusqu'à 20 envois dus (FOR UPDATE SKIP LOCKED).
    3. Pour chaque envoi : charge l'endpoint, envoie, enregistre la tentative.
    4. E-mail aux administrateurs à l'échec définitif (7e tentative).
    """
    import json

    # Reclaim expired leases first
    async with session_scope() as db:
        reclaimed = await webhook_outbox.reclaim_expired_leases(db)
        if reclaimed:
            log.info("webhooks.leases_reclaimed", count=reclaimed)

    # Claim and deliver
    async with session_scope() as db:
        claimed = await webhook_outbox.claim_due(db)

    delivered = 0
    for delivery_id, endpoint_id in claimed:
        try:
            async with session_scope() as db:
                delivery = await db.get(WebhookDelivery, delivery_id)
                endpoint = await db.get(WebhookEndpoint, endpoint_id)
                if delivery is None or endpoint is None or delivery.status != "sending":
                    continue

                body = json.dumps(delivery.payload, ensure_ascii=False).encode()
                headers = build_send_headers(endpoint, delivery_id, body)
                result = await http_deliver(endpoint.url, body, headers)

                await webhook_outbox.record_attempt(db, delivery_id, result)

                # Reload after record_attempt to check final status
                await db.refresh(delivery)
                if delivery.status == "failed":
                    await _notify_webhook_failure(db, delivery, endpoint)

            delivered += 1
        except Exception:  # noqa: BLE001
            log.exception("webhooks.deliver_crashed", delivery_id=delivery_id)

    return delivered


async def _notify_webhook_failure(
    db: AsyncSession,
    delivery: WebhookDelivery,
    endpoint: WebhookEndpoint,
) -> None:
    """Envoie un e-mail aux administrateurs quand un webhook échoue définitivement."""
    try:
        notification_emails: list[str] = await get_setting(db, "company.notification_emails")
        ctx: dict[str, Any] = {
            "endpoint_name": endpoint.name,
            "endpoint_url": endpoint.url,
            "delivery_id": str(delivery.id),
            "event_type": delivery.event_type,
            "attempt_count": delivery.attempt_count,
            "last_error": delivery.last_error or "unknown",
            "link": f"{settings.admin_url}/envois/{delivery.id}",
        }
        for address in notification_emails:
            await enqueue_email(
                db,
                to=address,
                template="webhook_final_failure",
                language="fr",
                context=ctx,
            )
        log.warning(
            "webhooks.final_failure_notified",
            delivery_id=str(delivery.id),
            endpoint=endpoint.name,
        )
    except Exception:  # noqa: BLE001
        log.exception("webhooks.notify_failure_crashed", delivery_id=str(delivery.id))


async def job_daily_digest() -> int:
    """Envoie le récapitulatif quotidien aux admins (§12.1, §13)."""
    async with session_scope() as db:
        stale_minutes: int = int(await get_setting(db, "requests.stale_alert_minutes"))
        notification_emails: list[str] = await get_setting(db, "company.notification_emails")

        threshold = utcnow() - timedelta(minutes=stale_minutes)

        stale_count = (
            await db.scalar(
                text("""
                    SELECT count(*) FROM demandes
                    WHERE status = 'received' AND created_at < :threshold
                      AND stale_alerted_at IS NOT NULL
                """),
                {"threshold": threshold},
            )
        ) or 0

        pending_past = (
            await db.scalar(
                text("SELECT count(*) FROM demandes WHERE status = 'received' AND pickup_at < now()")
            )
        ) or 0

        failed_emails = (
            await db.scalar(
                text("SELECT count(*) FROM email_outbox WHERE status = 'failed'")
            )
        ) or 0

        ctx: dict[str, Any] = {
            "stale_count": int(stale_count),
            "stale_minutes": stale_minutes,
            "pending_past": int(pending_past),
            "failed_emails": int(failed_emails),
            "link": settings.admin_url,
        }

        for address in notification_emails:
            await enqueue_email(
                db,
                to=address,
                template="daily_digest",
                language="fr",
                context=ctx,
            )

        return len(notification_emails)
