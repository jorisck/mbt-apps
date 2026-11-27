"""Tests des tâches planifiées (§12, §5.5, §4.4).

Couverture :
- Clôture automatique : aller-retour complet (confirmed → completed).
- Clôture automatique désactivée : aucun changement.
- Exécution unique : deux appels concurrents n'exécutent la tâche qu'une seule fois.
- Alerte demandes périmées : détection et marquage.
- Libération des baux expirés.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import timedelta

import pytest
from sqlalchemy import func, select, text

from app.db import session_scope
from app.domain.actors import Actor
from app.domain.settings.service import clear_cache
from app.models import Demande, DemandeEvent, EmailOutbox
from app.timeutil import utcnow
from app.worker.jobs import (
    SCHEDULE_AUTO_CLOSE,
    SCHEDULE_RECLAIM,
    Schedule,
    job_alert_stale_requests,
    job_auto_close_demandes,
    job_reclaim_expired_leases,
    run_job,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _make_demande(status: str = "received", pickup_offset_hours: float = 24.0) -> uuid.UUID:
    """Insère une demande directement en base (contourne la validation de dates)."""
    async with session_scope() as db:
        ref = f"T-TEST-{uuid.uuid4().int % 999999:06d}"
        d = Demande(
            reference=ref,
            status=status,
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_first_name="Test",
            passenger_last_name="User",
            passenger_phone="+32470000000",
            passenger_email=f"test-{uuid.uuid4().hex[:6]}@example.com",
            pickup_at=utcnow() + timedelta(hours=pickup_offset_hours),
            pickup_address={"formatted": "Rue Test 1, Bruxelles"},
            dropoff_address={"formatted": "Avenue Dest 2, Bruxelles"},
        )
        db.add(d)
    return d.id


async def _get_demande(demande_id: uuid.UUID) -> Demande:
    async with session_scope() as db:
        d = await db.get(Demande, demande_id)
        assert d is not None
        return d


async def _count_events(demande_id: uuid.UUID, event_type: str = "status_changed") -> int:
    async with session_scope() as db:
        return (
            await db.scalar(
                select(func.count()).where(
                    DemandeEvent.demande_id == demande_id,
                    DemandeEvent.type == event_type,
                )
            )
        ) or 0


async def _count_emails() -> int:
    async with session_scope() as db:
        return (await db.scalar(select(func.count()).select_from(EmailOutbox))) or 0


# ---------------------------------------------------------------------------
# Clôture automatique — aller-retour
# ---------------------------------------------------------------------------


async def test_auto_close_round_trip() -> None:
    """Une demande confirmée dont l'heure de référence est dépassée passe en completed.

    Vérifie : statut, closed_by, DemandeEvent system, absence d'e-mails.
    """
    # Créer une demande confirmée dont la prise en charge est passée (il y a 15 h,
    # délai par défaut de 12 h → due).
    demande_id = await _make_demande(status="confirmed", pickup_offset_hours=-15.0)

    closed = await job_auto_close_demandes()

    assert closed >= 1

    d = await _get_demande(demande_id)
    assert d.status == "completed"
    assert d.closed_by == "system"
    assert d.closed_at is not None

    # Un événement status_changed actor_type=system doit exister.
    async with session_scope() as db:
        evt = await db.scalar(
            select(DemandeEvent).where(
                DemandeEvent.demande_id == demande_id,
                DemandeEvent.type == "status_changed",
                DemandeEvent.actor_type == "system",
                DemandeEvent.to_status == "completed",
            )
        )
    assert evt is not None, "Aucun DemandeEvent system pour la clôture automatique"
    assert evt.from_status == "confirmed"
    assert evt.reason == "auto_close"

    # Aucun e-mail ne doit avoir été mis en file (§5.5 : aucun e-mail).
    assert await _count_emails() == 0


async def test_auto_close_ignores_not_yet_due() -> None:
    """Une demande confirmée dont l'heure n'est pas encore dépassée reste inchangée."""
    # Prise en charge dans 24 h : pas encore due.
    demande_id = await _make_demande(status="confirmed", pickup_offset_hours=24.0)

    closed = await job_auto_close_demandes()

    d = await _get_demande(demande_id)
    assert d.status == "confirmed", "La demande non due ne doit pas être clôturée"
    assert await _count_events(demande_id) == 0


async def test_auto_close_ignores_received_status() -> None:
    """Les demandes au statut received ne sont jamais clôturées automatiquement (§5.5)."""
    demande_id = await _make_demande(status="received", pickup_offset_hours=-15.0)

    await job_auto_close_demandes()

    d = await _get_demande(demande_id)
    assert d.status == "received"
    assert await _count_emails() == 0


# ---------------------------------------------------------------------------
# Clôture automatique désactivée
# ---------------------------------------------------------------------------


async def test_auto_close_disabled_skips_all() -> None:
    """Quand auto_close.enabled = false, aucune demande n'est clôturée."""
    # Désactiver la clôture automatique via SQL direct (pas de FK admin dans les tests).
    async with session_scope() as db:
        await db.execute(
            text(
                "INSERT INTO settings (key, value) VALUES ('auto_close.enabled', 'false') "
                "ON CONFLICT (key) DO UPDATE SET value = 'false'"
            )
        )
    clear_cache()

    demande_id = await _make_demande(status="confirmed", pickup_offset_hours=-15.0)

    closed = await job_auto_close_demandes()
    assert closed == 0

    d = await _get_demande(demande_id)
    assert d.status == "confirmed", "La clôture automatique désactivée ne doit pas modifier le statut"


# ---------------------------------------------------------------------------
# Exécution unique
# ---------------------------------------------------------------------------


async def test_run_job_unique_execution() -> None:
    """Deux appels concurrents à run_job pour la même tâche n'exécutent fn qu'une seule fois."""
    counter = 0

    async def counting_fn() -> int:
        nonlocal counter
        # Simuler du travail pour que les deux coroutines se chevauchent.
        await asyncio.sleep(0.05)
        counter += 1
        return 1

    # Schedule toujours due (intervalle nul).
    always_due = Schedule(interval=timedelta(seconds=0))

    await asyncio.gather(
        run_job("test_unique_exec", always_due, counting_fn),
        run_job("test_unique_exec", always_due, counting_fn),
    )

    assert counter == 1, (
        f"fn() appelée {counter} fois ; devrait l'être exactement 1 fois "
        "même avec deux workers concurrents"
    )


# ---------------------------------------------------------------------------
# Libération des baux expirés
# ---------------------------------------------------------------------------


async def test_reclaim_expired_leases() -> None:
    """Les e-mails en status=sending avec bail expiré repassent en pending."""
    async with session_scope() as db:
        expired = EmailOutbox(
            to_address="test@example.com",
            template="admin_invitation",
            language="fr",
            context={},
            status="sending",
            lease_until=utcnow() - timedelta(minutes=5),
        )
        db.add(expired)

    reclaimed = await job_reclaim_expired_leases()
    assert reclaimed >= 1

    async with session_scope() as db:
        rows = (
            await db.scalars(select(EmailOutbox).where(EmailOutbox.status == "pending"))
        ).all()
    assert any(str(r.to_address) == "test@example.com" for r in rows)


# ---------------------------------------------------------------------------
# Alerte demandes périmées
# ---------------------------------------------------------------------------


async def test_alert_stale_requests_marks_and_enqueues() -> None:
    """Les demandes received non traitées au-delà du seuil reçoivent une alerte (une seule fois)."""
    # Créer une demande ancienne non traitée (seuil par défaut 30 min, on simule 2 h de retard).
    # `created_at` est passé explicitement pour outrepasser le server_default.
    old_created_at = utcnow() - timedelta(hours=2)
    async with session_scope() as db:
        ref = f"T-STALE-{uuid.uuid4().int % 999999:06d}"
        d = Demande(
            reference=ref,
            status="received",
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_first_name="Stale",
            passenger_last_name="Test",
            passenger_phone="+32470000001",
            passenger_email="stale@example.com",
            pickup_at=utcnow() + timedelta(hours=24),
            pickup_address={"formatted": "Stale address"},
            dropoff_address={"formatted": "Stale dest"},
            created_at=old_created_at,
        )
        db.add(d)
        await db.flush()  # fire INSERT so that d.id is populated
        demande_id = d.id

    alerted = await job_alert_stale_requests()
    assert alerted >= 1

    # La demande doit être marquée comme alertée.
    d_after = await _get_demande(demande_id)
    assert d_after.stale_alerted_at is not None, "stale_alerted_at doit être positionné"

    # Un e-mail doit être en file.
    assert await _count_emails() >= 1

    # Un deuxième passage ne doit plus envoyer d'alerte pour la même demande.
    emails_before = await _count_emails()
    alerted2 = await job_alert_stale_requests()
    assert alerted2 == 0
    assert await _count_emails() == emails_before, "Aucun nouvel e-mail pour une demande déjà alertée"
