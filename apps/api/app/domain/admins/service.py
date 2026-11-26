"""Comptes admin : connexion, invitations, mots de passe, activation (§6.1, §6.8, §10).

Cette version n'a pas de double authentification : e-mail + mot de passe, avec verrouillage
progressif, limitation de débit et réauthentification par mot de passe pour les actions sensibles.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import timedelta

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.domain.actors import Actor
from app.domain.audit import audit
from app.domain.emails.outbox import enqueue_email
from app.models import Admin, AdminSession, AdminToken
from app.security import passwords, ratelimit, sessions
from app.timeutil import fmt_brussels, utcnow

LOCK_AFTER_FAILURES = 5
BASE_LOCK = timedelta(minutes=15)
MAX_LOCK = timedelta(hours=24)
IP_LIMIT = 20
IP_WINDOW_S = 600
INVITATION_TTL = timedelta(hours=72)
RESET_TTL = timedelta(hours=1)

GENERIC_LOGIN_ERROR = "Identifiants incorrects, ou compte temporairement verrouillé."


class AdminError(Exception):
    """Erreur métier affichable à l'utilisateur."""


@dataclass
class LoginResult:
    ok: bool
    token: str | None = None
    session: AdminSession | None = None
    error: str | None = None


def normalize_email(raw: str) -> str:
    try:
        return validate_email(raw.strip(), check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise AdminError("Adresse e-mail invalide.") from exc


def _hash_token(raw: str) -> bytes:
    return hashlib.sha256(raw.encode()).digest()


async def create_token(
    db: AsyncSession,
    admin_id: uuid.UUID,
    purpose: str,
    ttl: timedelta,
    created_by: uuid.UUID | None = None,
) -> str:
    raw = secrets.token_urlsafe(32)
    db.add(
        AdminToken(
            admin_id=admin_id,
            purpose=purpose,
            token_hash=_hash_token(raw),
            expires_at=utcnow() + ttl,
            created_by=created_by,
        )
    )
    await db.flush()
    return raw


async def find_token(
    db: AsyncSession, raw: str, purpose: str, *, lock: bool = False
) -> tuple[AdminToken, Admin] | None:
    stmt = (
        select(AdminToken, Admin)
        .join(Admin, Admin.id == AdminToken.admin_id)
        .where(
            AdminToken.token_hash == _hash_token(raw),
            AdminToken.purpose == purpose,
            AdminToken.used_at.is_(None),
            AdminToken.expires_at > utcnow(),
        )
    )
    if lock:
        stmt = stmt.with_for_update(of=AdminToken)
    row = (await db.execute(stmt)).first()
    return (row[0], row[1]) if row else None


# --- Connexion ---------------------------------------------------------------------------


async def login(db: AsyncSession, email: str, password: str, ip: str | None, user_agent: str | None) -> LoginResult:
    actor = Actor("anonymous", None, ip, user_agent)
    bucket = f"login:ip:{ip or 'unknown'}"
    if await ratelimit.hit(db, bucket, IP_WINDOW_S) > IP_LIMIT:
        passwords.burn_time(password)
        return LoginResult(False, error="Trop de tentatives. Réessayez dans quelques minutes.")

    try:
        normalized = normalize_email(email)
    except AdminError:
        passwords.burn_time(password)
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    admin = await db.scalar(select(Admin).where(Admin.email == normalized).with_for_update())
    now = utcnow()
    if admin is None or admin.status != "active" or not admin.password_hash:
        passwords.burn_time(password)
        await audit(db, actor, "auth.login.failed", details={"reason": "unknown_or_inactive"})
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    if admin.locked_until is not None and admin.locked_until > now:
        passwords.burn_time(password)
        await audit(db, actor, "auth.login.failed", "admin", admin.id, {"reason": "locked"})
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    if not passwords.verify_password(admin.password_hash, password):
        admin.failed_logins += 1
        details: dict[str, object] = {"reason": "bad_password"}
        if admin.failed_logins >= LOCK_AFTER_FAILURES:
            delay = min(BASE_LOCK * (2**admin.lockout_count), MAX_LOCK)
            admin.locked_until = now + delay
            admin.lockout_count += 1
            admin.failed_logins = 0
            details["locked_minutes"] = int(delay.total_seconds() // 60)
            await enqueue_email(
                db,
                to=str(admin.email),
                template="admin_locked",
                context={"name": admin.full_name, "until": fmt_brussels(admin.locked_until)},
            )
            await audit(db, actor, "auth.locked", "admin", admin.id, details)
        await audit(db, actor, "auth.login.failed", "admin", admin.id, details)
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    if passwords.needs_rehash(admin.password_hash):
        admin.password_hash = passwords.hash_password(password)

    known_device = False
    has_previous = False
    if user_agent:
        ua = user_agent[:300]
        previous = (
            (await db.execute(select(AdminSession.user_agent).where(AdminSession.admin_id == admin.id).limit(200)))
            .scalars()
            .all()
        )
        has_previous = bool(previous)
        known_device = ua in previous
    admin.failed_logins = 0
    admin.lockout_count = 0
    admin.locked_until = None
    admin.last_login_at = now
    token, session = await sessions.create_session(db, admin.id, ip, user_agent)
    admin_actor = Actor.admin(admin.id, ip, user_agent)
    await audit(db, admin_actor, "auth.login.succeeded", "admin", admin.id)
    if has_previous and not known_device:
        await enqueue_email(
            db,
            to=str(admin.email),
            template="admin_new_login",
            context={
                "name": admin.full_name,
                "when": fmt_brussels(now),
                "device": (user_agent or "inconnu")[:120],
                "ip": ip or "inconnue",
            },
        )
    return LoginResult(True, token=token, session=session)


async def logout(db: AsyncSession, admin: Admin, session: AdminSession, actor: Actor) -> None:
    await sessions.revoke_session(db, session.id)
    await audit(db, actor, "auth.logout", "admin", admin.id)


# --- Réauthentification (step-up) --------------------------------------------------------


async def step_up(db: AsyncSession, admin: Admin, session: AdminSession, password: str, actor: Actor) -> bool:
    bucket = f"stepup:admin:{admin.id}"
    if await ratelimit.hit(db, bucket, IP_WINDOW_S) > 10 or not admin.password_hash:
        return False
    if not passwords.verify_password(admin.password_hash, password):
        await audit(db, actor, "auth.step_up", "admin", admin.id, {"ok": False})
        return False
    sessions.open_step_up(session)
    await audit(db, actor, "auth.step_up", "admin", admin.id, {"ok": True})
    return True


# --- Invitations, activation ------------------------------------------------------------


def invitation_link(token: str) -> str:
    return f"{settings.admin_url}/invitations/{token}"


def reset_link(token: str) -> str:
    return f"{settings.admin_url}/password/reset/{token}"


async def invite_admin(db: AsyncSession, actor: Actor, email: str, full_name: str) -> tuple[Admin, str]:
    """Crée un admin en statut `invited` et envoie le lien d'invitation (valable 72 h)."""
    normalized = normalize_email(email)
    name = full_name.strip()
    if not (2 <= len(name) <= 100):
        raise AdminError("Indiquez le nom complet (2 à 100 caractères).")
    existing = await db.scalar(select(Admin).where(Admin.email == normalized))
    if existing is not None:
        raise AdminError("Un compte existe déjà avec cette adresse.")
    admin = Admin(email=normalized, full_name=name, status="invited", created_by=actor.id)
    db.add(admin)
    await db.flush()
    token = await create_token(db, admin.id, "invitation", INVITATION_TTL, actor.id)
    await enqueue_email(
        db,
        to=normalized,
        template="admin_invitation",
        context={"name": name, "link": invitation_link(token)},
    )
    await audit(db, actor, "admin.invited", "admin", admin.id)
    return admin, token


async def accept_invitation(db: AsyncSession, raw_token: str, password: str) -> Admin:
    found = await find_token(db, raw_token, "invitation", lock=True)
    if found is None:
        raise AdminError("Ce lien d'invitation est invalide ou a expiré.")
    token, admin = found
    try:
        passwords.validate_password(password, email=str(admin.email))
    except passwords.WeakPassword as exc:
        raise AdminError(str(exc)) from exc
    now = utcnow()
    admin.password_hash = passwords.hash_password(password)
    admin.password_changed_at = now
    admin.status = "active"
    admin.updated_at = now
    token.used_at = now
    await audit(db, Actor.admin(admin.id), "admin.activated", "admin", admin.id)
    return admin


# --- Mot de passe oublié / modifié -------------------------------------------------------


async def request_password_reset(db: AsyncSession, email: str, ip: str | None) -> None:
    """Réponse identique que l'e-mail existe ou non : rien n'est révélé à l'appelant."""
    actor = Actor("anonymous", None, ip)
    if await ratelimit.hit(db, f"reset:ip:{ip or 'unknown'}", IP_WINDOW_S) > IP_LIMIT:
        return
    try:
        normalized = normalize_email(email)
    except AdminError:
        return
    admin = await db.scalar(select(Admin).where(Admin.email == normalized))
    if admin is None or admin.status != "active":
        return
    token = await create_token(db, admin.id, "password_reset", RESET_TTL)
    await enqueue_email(
        db,
        to=str(admin.email),
        template="admin_password_reset",
        context={"name": admin.full_name, "link": reset_link(token)},
    )
    await audit(db, actor, "auth.password.reset_requested", "admin", admin.id)


async def reset_password(db: AsyncSession, raw_token: str, password: str) -> Admin:
    found = await find_token(db, raw_token, "password_reset", lock=True)
    if found is None:
        raise AdminError("Ce lien est invalide ou a expiré.")
    token, admin = found
    try:
        passwords.validate_password(password, email=str(admin.email))
    except passwords.WeakPassword as exc:
        raise AdminError(str(exc)) from exc
    now = utcnow()
    admin.password_hash = passwords.hash_password(password)
    admin.password_changed_at = now
    admin.failed_logins = 0
    admin.lockout_count = 0
    admin.locked_until = None
    admin.updated_at = now
    token.used_at = now
    await sessions.revoke_all(db, admin.id)
    await enqueue_email(db, to=str(admin.email), template="admin_password_changed", context={"name": admin.full_name})
    await audit(db, Actor.admin(admin.id), "auth.password.changed", "admin", admin.id, {"via": "reset"})
    return admin


async def change_password(
    db: AsyncSession,
    admin: Admin,
    session: AdminSession,
    current: str,
    new: str,
    actor: Actor,
) -> None:
    if not admin.password_hash or not passwords.verify_password(admin.password_hash, current):
        raise AdminError("Le mot de passe actuel est incorrect.")
    try:
        passwords.validate_password(new, email=str(admin.email))
    except passwords.WeakPassword as exc:
        raise AdminError(str(exc)) from exc
    admin.password_hash = passwords.hash_password(new)
    admin.password_changed_at = utcnow()
    admin.updated_at = utcnow()
    await sessions.revoke_all(db, admin.id, except_session_id=session.id)
    await enqueue_email(db, to=str(admin.email), template="admin_password_changed", context={"name": admin.full_name})
    await audit(db, actor, "auth.password.changed", "admin", admin.id, {"via": "account"})


# --- Gestion des admins ------------------------------------------------------------------


async def active_admin_count(db: AsyncSession, excluding: uuid.UUID | None = None) -> int:
    stmt = select(func.count()).select_from(Admin).where(Admin.status == "active")
    if excluding is not None:
        stmt = stmt.where(Admin.id != excluding)
    return int(await db.scalar(stmt) or 0)


async def set_admin_enabled(db: AsyncSession, actor: Actor, target_id: uuid.UUID, enabled: bool) -> Admin:
    target = await db.scalar(select(Admin).where(Admin.id == target_id).with_for_update())
    if target is None:
        raise AdminError("Administrateur introuvable.")
    if enabled:
        if target.status != "disabled":
            raise AdminError("Ce compte n'est pas désactivé.")
        target.status = "active" if target.password_hash else "invited"
        await audit(db, actor, "admin.enabled", "admin", target.id)
    else:
        if target.id == actor.id:
            raise AdminError("Vous ne pouvez pas désactiver votre propre compte.")
        if target.status == "active" and await active_admin_count(db, excluding=target.id) < 1:
            raise AdminError("Il doit toujours rester au moins un administrateur actif.")
        target.status = "disabled"
        await sessions.revoke_all(db, target.id)
        await enqueue_email(
            db,
            to=str(target.email),
            template="admin_disabled_notice",
            context={"name": target.full_name},
        )
        await audit(db, actor, "admin.disabled", "admin", target.id)
    target.updated_at = utcnow()
    return target


async def revoke_admin_sessions(db: AsyncSession, actor: Actor, target_id: uuid.UUID) -> int:
    count = await sessions.revoke_all(db, target_id)
    await audit(db, actor, "auth.session.revoked", "admin", target_id, {"count": count})
    return count
