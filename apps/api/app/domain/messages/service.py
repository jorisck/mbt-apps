"""Traitement d'un message hors cycle de vie des demandes : e-mail à l'équipe uniquement."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.actors import Actor
from app.domain.audit import audit
from app.domain.emails.outbox import enqueue_email
from app.domain.messages.schemas import MessageCreate
from app.domain.settings.service import get_setting

KIND_LABELS = {
    "contact": "Contact",
    "quote": "Devis",
    "adaptation": "Adaptation de véhicule",
    "location_sale": "Location / vente",
}


async def create_message(
    db: AsyncSession, data: MessageCreate, *, origin: str, actor: Actor
) -> None:
    name = f"{data.first_name} {data.last_name}".strip()
    details_lines = []
    for key, value in sorted(data.details.items()):
        if value is None or value == "":
            continue
        details_lines.append(f"{key}: {value}")
    details_text = "\n".join(details_lines) if details_lines else "—"
    ctx = {
        "kind": KIND_LABELS[data.kind],
        "name": name,
        "email": data.email,
        "phone": data.phone or "—",
        "language": data.language.upper(),
        "subject": data.subject or KIND_LABELS[data.kind],
        "body": data.body,
        "details": details_text,
        "origin": origin,
    }
    for address in await get_setting(db, "company.notification_emails"):
        await enqueue_email(
            db, to=address, template="message_new", language="fr", context=ctx
        )
    await audit(
        db,
        actor,
        "message.created",
        "message",
        None,
        {"kind": data.kind, "origin": origin},
    )
