"""Services des demandes : création, transitions, assignation, notes (§5, §18.7).

Toutes les transitions passent par `transition()` : vérification, changement, événement, audit et
e-mails dans la même transaction.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import timedelta
from typing import Any

import httpx
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.domain.actors import Actor
from app.domain.audit import audit
from app.domain.demandes import state_machine as sm
from app.domain.demandes.schemas import DemandeCreate, NeedsIn
from app.domain.emails.outbox import enqueue_email
from app.domain.places import resolve_address
from app.domain.settings.service import get_setting
from app.domain.webhooks.outbox import enqueue_webhook_event
from app.errors import ApiProblem, BusinessRule, Conflict, PreconditionFailed
from app.models import Demande, DemandeEvent, DemandeNote
from app.timeutil import (
    NonexistentLocalTime,
    fmt_brussels,
    parse_brussels_local,
    to_brussels,
    utcnow,
)

MAX_HORIZON = timedelta(days=366)

MOBILITY_LABELS = {
    "none": "aucune aide",
    "walking_aid": "aide à la marche",
    "manual_wheelchair": "fauteuil manuel",
    "electric_wheelchair": "fauteuil électrique",
    "other": "autre",
}
ORIGIN_LABELS = {
    "site_mbt": "site MBT Taxis",
    "site_handycab": "site HandyCab",
    "app_ios": "application iOS",
    "app_android": "application Android",
}
SERVICE_LABELS = {"business": "Entreprises", "daily": "Quotidien", "vsl": "VSL", "pmr": "PMR"}


# --- Contexte des e-mails ----------------------------------------------------------------


def needs_summary(needs: dict[str, Any] | None) -> str:
    if not needs:
        return "aucun besoin particulier indiqué"
    parts = [MOBILITY_LABELS.get(needs.get("mobility_aid", "none"), "—")]
    if needs.get("stays_in_wheelchair"):
        parts.append("reste dans son fauteuil")
    if needs.get("companions"):
        parts.append(f"{needs['companions']} accompagnant(s)")
    if needs.get("door_to_door"):
        parts.append("aide de porte à porte")
    if needs.get("notes"):
        parts.append(f"remarques : {needs['notes']}")
    return ", ".join(parts)


async def email_context(db: AsyncSession, d: Demande) -> dict[str, Any]:
    phone = await get_setting(db, "company.public_phone")
    return {
        "ref": d.reference,
        "name": " ".join(filter(None, [d.passenger_first_name, d.passenger_last_name])) or "",
        "first_name": d.passenger_first_name or "",
        "when": fmt_brussels(d.pickup_at),
        "pickup": d.pickup_address.get("formatted", ""),
        "dropoff": d.dropoff_address.get("formatted", ""),
        "return_when": fmt_brussels(d.return_at) if d.return_at else "",
        "phone": phone,
        "reason": d.refusal_reason or d.cancellation_reason or "",
        "link": f"{settings.admin_url}/demandes/{d.id}",
    }


async def _notify_team(db: AsyncSession, template: str, d: Demande, ctx: dict[str, Any]) -> None:
    for address in await get_setting(db, "company.notification_emails"):
        await enqueue_email(db, to=address, template=template, language="fr", context=ctx, demande_id=d.id)


async def enqueue_status_emails(db: AsyncSession, d: Demande, previous: str, actor: Actor) -> None:
    if not d.passenger_email:
        return
    ctx = await email_context(db, d)
    to = d.status
    template = {
        "confirmed": "demande_confirmed",
        "refused": "demande_refused",
        "cancelled": "demande_cancelled",
    }.get(to)
    if template is None:  # terminée / non effectuée : aucun e-mail (§5.3)
        return
    await enqueue_email(
        db,
        to=str(d.passenger_email),
        template=template,
        language=d.language,
        context=ctx,
        demande_id=d.id,
    )
    if to == "cancelled" and actor.type == "passenger":
        await _notify_team(db, "demande_cancelled_team", d, ctx)


# --- Création ----------------------------------------------------------------------------


def _fingerprint(data: DemandeCreate) -> bytes:
    body = data.model_dump(mode="json", exclude={"antispam", "places_session_token"})
    return hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).digest()


async def _existing(db: AsyncSession, key: str) -> Demande | None:
    return await db.scalar(select(Demande).where(Demande.idempotency_key == key))


def _check_existing(existing: Demande, fingerprint: bytes) -> Demande:
    if existing.request_fingerprint != fingerprint:
        raise ApiProblem(422, "idempotency_key_reused", "Cette clé d'idempotence a déjà servi pour un autre contenu.")
    return existing


async def next_reference(db: AsyncSession) -> str:
    number = int(await db.scalar(text("SELECT nextval('demande_number_seq')")) or 0)
    year = to_brussels(utcnow()).year
    return f"{settings.reference_prefix}-{year}-{number:06d}"


async def create_demande(
    db: AsyncSession,
    data: DemandeCreate,
    *,
    origin: str,
    idempotency_key: str,
    actor: Actor,
    passenger_id: uuid.UUID | None = None,
    places_client: httpx.AsyncClient | None = None,
) -> tuple[Demande, bool]:
    """Crée une demande. Renvoie (demande, créée) ; `créée` vaut False pour un rejeu idempotent."""
    fingerprint = _fingerprint(data)
    if (found := await _existing(db, idempotency_key)) is not None:
        return _check_existing(found, fingerprint), False

    if not data.privacy_consent:
        raise ApiProblem(
            422, "privacy_consent_required", "Le consentement est obligatoire.", {"privacy_consent": "Obligatoire."}
        )
    if data.needs is not None and not data.health_consent:
        raise ApiProblem(
            422,
            "health_consent_required",
            "Le consentement explicite aux données de santé est requis pour indiquer des besoins.",
            {"health_consent": "Obligatoire pour transmettre des besoins de mobilité."},
        )

    try:
        pickup_at = parse_brussels_local(data.pickup_at)
        return_at = parse_brussels_local(data.return_at) if data.return_at else None
    except NonexistentLocalTime:
        raise ApiProblem(422, "nonexistent_local_time", "Cette heure n'existe pas (changement d'heure).") from None
    except ValueError:
        raise ApiProblem(422, "validation_error", "Date invalide.", {"pickup_at": "Date invalide."}) from None

    now = utcnow()
    min_lead = int(await get_setting(db, "requests.min_lead_minutes"))
    if pickup_at < now + timedelta(minutes=min_lead):
        raise BusinessRule(
            "pickup_too_soon", f"La prise en charge doit être au moins {min_lead} minutes dans le futur."
        )
    if pickup_at > now + MAX_HORIZON:
        raise BusinessRule("pickup_too_far", "La prise en charge ne peut pas dépasser 12 mois.")
    if return_at is not None and return_at <= pickup_at:
        raise BusinessRule("return_before_pickup", "Le retour doit être postérieur à l'aller.")

    pickup = await resolve_address(data.pickup, data.places_session_token, places_client)
    dropoff = await resolve_address(data.dropoff, data.places_session_token, places_client)
    return_pickup = (
        await resolve_address(data.return_pickup, data.places_session_token, places_client)
        if data.return_pickup
        else None
    )

    # Verrou par clé : deux requêtes identiques simultanées ne créent qu'une demande.
    await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": f"demande:{idempotency_key}"})
    if (found := await _existing(db, idempotency_key)) is not None:
        return _check_existing(found, fingerprint), False

    needs = _needs_dict(data.needs)
    demande = Demande(
        reference=await next_reference(db),
        status="received",
        origin=origin,
        service=data.service,
        language=data.passenger.language,
        passenger_id=passenger_id,
        passenger_first_name=data.passenger.first_name,
        passenger_last_name=data.passenger.last_name,
        passenger_phone=data.passenger.phone,
        passenger_email=data.passenger.email,
        pickup_at=pickup_at,
        pickup_address=pickup,
        pickup_instructions=data.pickup.instructions,
        dropoff_address=dropoff,
        return_at=return_at,
        return_pickup_address=return_pickup,
        passenger_count=data.passenger_count,
        needs=needs,
        health_consent_at=now if needs is not None else None,
        comment=data.comment,
        idempotency_key=idempotency_key,
        request_fingerprint=fingerprint,
    )
    db.add(demande)
    await db.flush()
    db.add(
        DemandeEvent(
            demande_id=demande.id,
            revision=demande.revision,
            type="created",
            to_status="received",
            actor_type="guest" if actor.type == "guest" else actor.type,
            actor_id=actor.id,
        )
    )
    await audit(
        db,
        actor,
        "demande.created",
        "demande",
        demande.id,
        {"reference": demande.reference, "origin": origin, "service": data.service},
    )

    ctx = await email_context(db, demande)
    await enqueue_email(
        db,
        to=data.passenger.email,
        template="demande_received",
        language=demande.language,
        context=ctx,
        demande_id=demande.id,
    )
    team_ctx = {
        **ctx,
        "origin": ORIGIN_LABELS[origin],
        "service": SERVICE_LABELS[data.service],
        "count": demande.passenger_count,
        "email": data.passenger.email,
        "language": data.passenger.language.upper(),
        "needs": needs_summary(needs),
        "comment": data.comment or "—",
    }
    await _notify_team(db, "demande_new", demande, team_ctx)
    return demande, True


def _needs_dict(needs: NeedsIn | None) -> dict[str, Any] | None:
    return needs.model_dump(mode="json") if needs is not None else None


# --- Transitions -------------------------------------------------------------------------


async def _check_business_rules(db: AsyncSession, d: Demande, to: str, actor: Actor, reason: str | None) -> None:
    now = utcnow()
    reason = (reason or "").strip()
    if len(reason) > sm.MAX_REASON_LENGTH:
        raise BusinessRule("reason_too_long", f"Le motif ne peut pas dépasser {sm.MAX_REASON_LENGTH} caractères.")

    if to == "refused" and not reason:
        raise BusinessRule("reason_required", "Un motif est obligatoire pour refuser une demande.")
    if to == "cancelled":
        if actor.type == "admin" and not reason:
            raise BusinessRule("reason_required", "Un motif est obligatoire pour annuler une demande.")
        if actor.type == "passenger":
            hours = int(await get_setting(db, "passenger.cancellation_deadline_hours"))
            limit = d.pickup_at if d.status == "received" else sm.cancellation_deadline(d.pickup_at, hours)
            if now > limit:
                raise BusinessRule(
                    "cancellation_too_late",
                    "Le délai d'annulation est dépassé : appelez-nous.",
                )
    if to in {"completed", "not_completed"} and d.status == "confirmed":
        if actor.type == "admin" and sm.reference_time(d.pickup_at, d.return_at) > now:
            raise BusinessRule("pickup_not_passed", "L'heure de prise en charge n'est pas encore passée.")
        if to == "not_completed" and not reason:
            raise BusinessRule("reason_required", "Choisissez un motif.")
    if d.status in {"completed", "not_completed"} and to in {"completed", "not_completed"}:
        window = int(await get_setting(db, "requests.correction_window_days"))
        if d.closed_at is None or now > d.closed_at + timedelta(days=window):
            raise BusinessRule(
                "correction_window_closed", f"La correction n'est possible que {window} jours après la clôture."
            )
        if not reason:
            raise BusinessRule("reason_required", "Un motif est obligatoire pour une correction.")


async def transition(
    db: AsyncSession,
    demande_id: uuid.UUID,
    *,
    to: str,
    actor: Actor,
    expected_revision: int | None,
    reason: str | None = None,
) -> Demande:
    d = await db.scalar(select(Demande).where(Demande.id == demande_id).with_for_update())
    if d is None:
        raise ApiProblem(404, "not_found", "Demande introuvable.")
    if expected_revision is not None and d.revision != expected_revision:
        raise PreconditionFailed("revision_mismatch")
    if actor.type not in sm.TRANSITIONS.get((d.status, to), set()):
        raise Conflict("invalid_transition")
    await _check_business_rules(db, d, to, actor, reason)

    reason = (reason or "").strip() or None
    previous, d.status = d.status, to
    d.revision += 1
    d.updated_at = utcnow()
    if to in sm.FINAL and previous not in sm.FINAL:
        d.closed_at, d.closed_by = utcnow(), actor.type
    if to == "refused":
        d.refusal_reason = reason
    if to == "cancelled":
        d.cancellation_reason, d.cancelled_by = reason, actor.type
    db.add(
        DemandeEvent(
            demande_id=d.id,
            revision=d.revision,
            type="status_changed",
            from_status=previous,
            to_status=to,
            actor_type=actor.type,
            actor_id=actor.id,
            reason=reason,
        )
    )
    await audit(
        db, actor, "demande.status_changed", "demande", d.id, {"reference": d.reference, "from": previous, "to": to}
    )
    await enqueue_status_emails(db, d, previous, actor)

    # Webhooks sortants (lot L4) : déclenché pour les transitions OUTBOUND_EVENT.
    outbound_event = sm.OUTBOUND_EVENT.get(to)
    if outbound_event:
        await enqueue_webhook_event(db, d, outbound_event)

    await db.flush()
    return d


async def assign(
    db: AsyncSession,
    demande_id: uuid.UUID,
    admin_id: uuid.UUID | None,
    *,
    actor: Actor,
    expected_revision: int,
) -> Demande:
    """« Je m'en occupe » : indique à l'équipe qu'une demande est prise en charge."""
    d = await db.scalar(select(Demande).where(Demande.id == demande_id).with_for_update())
    if d is None:
        raise ApiProblem(404, "not_found", "Demande introuvable.")
    if d.revision != expected_revision:
        raise PreconditionFailed("revision_mismatch")
    d.assigned_admin_id = admin_id
    d.revision += 1
    d.updated_at = utcnow()
    db.add(
        DemandeEvent(
            demande_id=d.id,
            revision=d.revision,
            type="assigned",
            actor_type=actor.type,
            actor_id=actor.id,
        )
    )
    await audit(
        db,
        actor,
        "demande.assigned",
        "demande",
        d.id,
        {"reference": d.reference, "assigned_to": str(admin_id) if admin_id else None},
    )
    await db.flush()
    return d


# --- Notes internes ----------------------------------------------------------------------


async def add_note(db: AsyncSession, demande_id: uuid.UUID, actor: Actor, body: str) -> DemandeNote:
    body = body.strip()
    if not body:
        raise BusinessRule("note_empty", "La note est vide.")
    if len(body) > 2000:
        raise BusinessRule("note_too_long", "Une note ne peut pas dépasser 2 000 caractères.")
    if await db.get(Demande, demande_id) is None:
        raise ApiProblem(404, "not_found", "Demande introuvable.")
    assert actor.id is not None
    note = DemandeNote(demande_id=demande_id, admin_id=actor.id, body=body)
    db.add(note)
    await db.flush()
    await audit(db, actor, "demande.note_added", "demande", demande_id, {"note_id": str(note.id)})
    return note


async def delete_note(db: AsyncSession, note_id: uuid.UUID, actor: Actor) -> None:
    """Suppression logique, par l'auteur uniquement."""
    note = await db.get(DemandeNote, note_id)
    if note is None or note.deleted_at is not None:
        raise ApiProblem(404, "not_found", "Note introuvable.")
    if note.admin_id != actor.id:
        raise ApiProblem(403, "forbidden", "Seul l'auteur peut supprimer sa note.")
    note.deleted_at = utcnow()
    await audit(db, actor, "demande.note_deleted", "demande", note.demande_id, {"note_id": str(note.id)})
