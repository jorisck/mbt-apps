"""Outbox des e-mails : écrite dans la même transaction que l'événement qui la déclenche."""

from __future__ import annotations

import uuid
from datetime import timedelta
from typing import Any

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.emails import provider, templates
from app.models import EmailOutbox
from app.timeutil import utcnow

log = structlog.get_logger("emails")

MAX_ATTEMPTS = 6
BACKOFF = [timedelta(seconds=30), timedelta(minutes=2), timedelta(minutes=10), timedelta(hours=1), timedelta(hours=6)]
LEASE = timedelta(minutes=2)


async def enqueue_email(
    db: AsyncSession,
    *,
    to: str,
    template: str,
    language: str = "fr",
    context: dict[str, Any] | None = None,
    demande_id: uuid.UUID | None = None,
) -> EmailOutbox:
    row = EmailOutbox(
        to_address=to,
        template=template,
        language=language,
        context=context or {},
        demande_id=demande_id,
    )
    db.add(row)
    await db.flush()
    return row


async def reclaim_expired_leases(db: AsyncSession) -> int:
    result = await db.execute(
        update(EmailOutbox)
        .where(EmailOutbox.status == "sending", EmailOutbox.lease_until < utcnow())
        .values(status="pending", lease_until=None)
    )
    return result.rowcount or 0


async def claim_due(db: AsyncSession, limit: int = 20) -> list[uuid.UUID]:
    """Réserve des e-mails dus (FOR UPDATE SKIP LOCKED) et pose un bail."""
    rows = (
        await db.scalars(
            select(EmailOutbox)
            .where(EmailOutbox.status == "pending", EmailOutbox.next_attempt_at <= utcnow())
            .order_by(EmailOutbox.next_attempt_at)
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
    ).all()
    now = utcnow()
    for row in rows:
        row.status = "sending"
        row.lease_until = now + LEASE
        row.attempt_count += 1
    return [row.id for row in rows]


async def deliver(db: AsyncSession, email_id: uuid.UUID) -> bool:
    """Envoie un e-mail réservé et enregistre le résultat. Renvoie True en cas de succès."""
    row = await db.get(EmailOutbox, email_id)
    if row is None or row.status != "sending":
        return False
    rendered = templates.render(row.template, row.language, row.context or {})
    try:
        message_id = await provider.send_email(
            to=str(row.to_address),
            subject=rendered.subject,
            text=rendered.text,
            html=rendered.html,
            idempotency_key=str(row.id),
        )
    except provider.PermanentEmailError as exc:
        row.status, row.last_error, row.lease_until = "failed", str(exc), None
        log.warning("email.failed", id=str(row.id), template=row.template, error=str(exc))
        return False
    except provider.TemporaryEmailError as exc:
        row.last_error, row.lease_until = str(exc), None
        if row.attempt_count >= MAX_ATTEMPTS:
            row.status = "failed"
            log.warning("email.abandoned", id=str(row.id), template=row.template)
        else:
            row.status = "pending"
            row.next_attempt_at = utcnow() + BACKOFF[min(row.attempt_count - 1, len(BACKOFF) - 1)]
        return False

    row.status, row.sent_at, row.lease_until = "sent", utcnow(), None
    row.provider_message_id = message_id
    row.last_error = None
    if row.template in templates.SENSITIVE_TEMPLATES:
        row.context = {}  # le lien à usage unique ne doit pas rester en base
    return True
