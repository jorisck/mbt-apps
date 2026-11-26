"""Sessions admin : jeton opaque 256 bits, seul son haché SHA-256 est stocké (§10.3).

Expiration : 2 h d'inactivité, 12 h au maximum. Réauthentification (step-up) : fenêtre de 10 min,
ouverte par la saisie du mot de passe (cette version n'a pas de double authentification).
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Admin, AdminSession
from app.timeutil import utcnow

IDLE_TIMEOUT = timedelta(hours=2)
ABSOLUTE_TIMEOUT = timedelta(hours=12)
STEP_UP_WINDOW = timedelta(minutes=10)
TOUCH_INTERVAL = timedelta(minutes=1)


def hash_token(token: str) -> bytes:
    return hashlib.sha256(token.encode()).digest()


def new_token() -> str:
    return secrets.token_urlsafe(32)


async def create_session(
    db: AsyncSession, admin_id: uuid.UUID, ip: str | None, user_agent: str | None
) -> tuple[str, AdminSession]:
    token = new_token()
    now = utcnow()
    session = AdminSession(
        admin_id=admin_id,
        token_hash=hash_token(token),
        csrf_token=secrets.token_urlsafe(32),
        ip=ip,
        user_agent=(user_agent or "")[:300] or None,
        created_at=now,
        last_seen_at=now,
        expires_at=now + ABSOLUTE_TIMEOUT,
    )
    db.add(session)
    await db.flush()
    return token, session


async def load_session(db: AsyncSession, token: str) -> tuple[AdminSession, Admin] | None:
    row = (
        await db.execute(
            select(AdminSession, Admin)
            .join(Admin, Admin.id == AdminSession.admin_id)
            .where(AdminSession.token_hash == hash_token(token))
        )
    ).first()
    if row is None:
        return None
    session, admin = row
    now = utcnow()
    if (
        session.revoked_at is not None
        or session.expires_at <= now
        or session.last_seen_at + IDLE_TIMEOUT <= now
        or admin.status != "active"
    ):
        return None
    if now - session.last_seen_at >= TOUCH_INTERVAL:
        session.last_seen_at = now
    return session, admin


async def revoke_session(db: AsyncSession, session_id: uuid.UUID) -> None:
    await db.execute(
        update(AdminSession)
        .where(AdminSession.id == session_id, AdminSession.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )


async def revoke_all(db: AsyncSession, admin_id: uuid.UUID, except_session_id: uuid.UUID | None = None) -> int:
    stmt = update(AdminSession).where(AdminSession.admin_id == admin_id, AdminSession.revoked_at.is_(None))
    if except_session_id is not None:
        stmt = stmt.where(AdminSession.id != except_session_id)
    result = await db.execute(stmt.values(revoked_at=utcnow()))
    return result.rowcount or 0


def has_step_up(session: AdminSession, now: datetime | None = None) -> bool:
    return session.step_up_until is not None and session.step_up_until > (now or utcnow())


def open_step_up(session: AdminSession) -> None:
    session.step_up_until = utcnow() + STEP_UP_WINDOW
