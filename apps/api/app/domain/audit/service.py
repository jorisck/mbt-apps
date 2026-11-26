"""Journal d'audit en ajout seul, chaîné par empreintes SHA-256 (§10.9).

`details` ne contient jamais de donnée personnelle ni de secret : des identifiants et des
références uniquement. Chaque entrée est aussi écrite dans les logs applicatifs (copie externe).
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any

import structlog
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.actors import Actor
from app.models import AuditLog
from app.timeutil import utcnow

log = structlog.get_logger("audit")

_ADVISORY_KEY = 7_340_001  # verrou transactionnel : garde la chaîne strictement linéaire
_ACTOR_TYPES = {"admin", "passenger", "system", "anonymous"}


def _canonical(details: dict[str, Any]) -> str:
    return json.dumps(details, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def compute_hash(
    prev_hash: bytes | None,
    occurred_at: datetime,
    actor_type: str,
    actor_id: str | None,
    action: str,
    entity_type: str | None,
    entity_id: str | None,
    details: dict[str, Any],
) -> bytes:
    parts = [
        prev_hash.hex() if prev_hash else "",
        occurred_at.isoformat(),
        actor_type,
        actor_id or "",
        action,
        entity_type or "",
        entity_id or "",
        _canonical(details),
    ]
    return hashlib.sha256("\x1f".join(parts).encode()).digest()


async def audit(
    db: AsyncSession,
    actor: Actor,
    action: str,
    entity_type: str | None = None,
    entity_id: object | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    actor_type = actor.type if actor.type in _ACTOR_TYPES else "anonymous"
    details = details or {}
    entity = str(entity_id) if entity_id is not None else None
    await db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": _ADVISORY_KEY})
    prev = await db.scalar(select(AuditLog.hash).order_by(AuditLog.id.desc()).limit(1))
    occurred_at = utcnow()
    actor_id = str(actor.id) if actor.id else None
    entry = AuditLog(
        occurred_at=occurred_at,
        actor_type=actor_type,
        actor_id=actor.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity,
        ip=actor.ip,
        user_agent=(actor.user_agent or "")[:300] or None,
        details=details,
        prev_hash=prev,
        hash=compute_hash(prev, occurred_at, actor_type, actor_id, action, entity_type, entity, details),
    )
    db.add(entry)
    await db.flush()
    log.info(
        "audit",
        action=action,
        actor_type=actor_type,
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity,
        details=details,
    )
    return entry


async def verify_chain(db: AsyncSession) -> tuple[bool, int | None]:
    """Recalcule la chaîne. Renvoie (intègre, numéro de la première entrée en rupture).

    La plus ancienne entrée conservée sert de point d'ancrage (après une purge).
    """
    rows = (await db.scalars(select(AuditLog).order_by(AuditLog.id))).all()
    previous: bytes | None = None
    for index, row in enumerate(rows):
        if index > 0 and row.prev_hash != previous:
            return False, row.id
        expected = compute_hash(
            row.prev_hash,
            row.occurred_at,
            row.actor_type,
            str(row.actor_id) if row.actor_id else None,
            row.action,
            row.entity_type,
            row.entity_id,
            row.details,
        )
        if expected != row.hash:
            return False, row.id
        previous = row.hash
    return True, None
