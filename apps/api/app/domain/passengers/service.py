"""Comptes passagers : inscription, vérification, connexion, rotation des jetons, mot de passe (§18.3).

Même philosophie que `app/domain/admins/service.py` : toutes les règles métier ici, les routes
restent minces.  Les jetons d'accès sont des JWT HS256 (aud = handycab-v1, 15 min) ;  les jetons de
rafraîchissement sont opaques (secrets.token_urlsafe), stockés en tant que SHA-256.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

import jwt
from email_validator import EmailNotValidError, validate_email
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.domain.actors import Actor
from app.domain.audit import audit
from app.domain.emails.outbox import enqueue_email
from app.models import Demande, Passenger, PassengerRefreshToken, PassengerToken
from app.security import passwords, ratelimit
from app.timeutil import utcnow

# --- Constantes --------------------------------------------------------------------------

LOCK_AFTER_FAILURES = 5
BASE_LOCK = timedelta(minutes=15)
MAX_LOCK = timedelta(hours=24)
IP_LIMIT = 20
IP_WINDOW_S = 600

VERIFY_TTL = timedelta(hours=24)
RESET_TTL = timedelta(hours=1)
REFRESH_GRACE_S = 30          # tolérance réseau : réutilisation dans les 30 s (§18.3)

JWT_AUDIENCE = "handycab-v1"
JWT_ALGORITHM = "HS256"

GENERIC_LOGIN_ERROR = "Identifiants incorrects, ou compte temporairement verrouillé."


# --- Exceptions métier -------------------------------------------------------------------

class PassengerError(Exception):
    """Erreur métier affichable à l'utilisateur."""


# --- Schémas de réponse ------------------------------------------------------------------

@dataclass
class TokenPair:
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@dataclass
class LoginResult:
    """Résultat de la tentative de connexion. Pas d'exception levée : la transaction commit."""
    ok: bool
    pair: TokenPair | None = None
    error: str | None = None


@dataclass
class RefreshResult:
    """Résultat de la rotation. Pas d'exception levée : la transaction commit les révocations."""
    ok: bool
    pair: TokenPair | None = None
    error: str | None = None


# --- Helpers internes --------------------------------------------------------------------

def normalize_email(raw: str) -> str:
    try:
        return validate_email(raw.strip(), check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise PassengerError("Adresse e-mail invalide.") from exc


def _hash_token(raw: str) -> bytes:
    return hashlib.sha256(raw.encode()).digest()


def _make_access_token(passenger_id: uuid.UUID) -> str:
    """JWT d'accès HS256, 15 min, aud = handycab-v1 (§18.3)."""
    now = utcnow()
    payload = {
        "sub": str(passenger_id),
        "aud": JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_ttl_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> uuid.UUID:
    """Vérifie un JWT d'accès. Accepte SECRET_KEY_PREVIOUS pendant une rotation (§18.3)."""
    keys = [k for k in [settings.secret_key, settings.secret_key_previous] if k]
    last_exc: Exception = Exception("jeton vide")
    for key in keys:
        try:
            payload = jwt.decode(
                token,
                key,
                algorithms=[JWT_ALGORITHM],
                audience=JWT_AUDIENCE,
            )
            return uuid.UUID(payload["sub"])
        except (jwt.InvalidTokenError, ValueError, KeyError) as exc:
            last_exc = exc
    raise PassengerError("Jeton d'accès invalide ou expiré.") from last_exc


# --- Jetons à usage unique (email_verify / password_reset) --------------------------------

async def _create_one_time_token(db: AsyncSession, passenger_id: uuid.UUID, purpose: str, ttl: timedelta) -> str:
    raw = secrets.token_urlsafe(32)
    db.add(
        PassengerToken(
            passenger_id=passenger_id,
            purpose=purpose,
            token_hash=_hash_token(raw),
            expires_at=utcnow() + ttl,
        )
    )
    await db.flush()
    return raw


async def _find_one_time_token(
    db: AsyncSession, raw: str, purpose: str, *, lock: bool = False
) -> tuple[PassengerToken, Passenger] | None:
    stmt = (
        select(PassengerToken, Passenger)
        .join(Passenger, Passenger.id == PassengerToken.passenger_id)
        .where(
            PassengerToken.token_hash == _hash_token(raw),
            PassengerToken.purpose == purpose,
            PassengerToken.used_at.is_(None),
            PassengerToken.expires_at > utcnow(),
        )
    )
    if lock:
        stmt = stmt.with_for_update(of=PassengerToken)
    row = (await db.execute(stmt)).first()
    return (row[0], row[1]) if row else None


# --- Révocation des jetons de rafraîchissement -------------------------------------------

async def _revoke_family(db: AsyncSession, family_id: uuid.UUID) -> None:
    """Révoque tous les jetons actifs d'une famille."""
    rows = (
        await db.execute(
            select(PassengerRefreshToken)
            .where(
                PassengerRefreshToken.family_id == family_id,
                PassengerRefreshToken.revoked_at.is_(None),
            )
            .with_for_update()
        )
    ).scalars().all()
    now = utcnow()
    for row in rows:
        row.revoked_at = now


async def _revoke_all_families(db: AsyncSession, passenger_id: uuid.UUID) -> int:
    """Révoque toutes les familles actives d'un passager (§18.3 point 6)."""
    rows = (
        await db.execute(
            select(PassengerRefreshToken)
            .where(
                PassengerRefreshToken.passenger_id == passenger_id,
                PassengerRefreshToken.revoked_at.is_(None),
            )
            .with_for_update()
        )
    ).scalars().all()
    now = utcnow()
    for row in rows:
        row.revoked_at = now
    return len(rows)


async def _new_refresh_token(
    db: AsyncSession,
    passenger_id: uuid.UUID,
    family_id: uuid.UUID,
    client: str,
    device_label: str | None,
) -> str:
    """Crée un nouveau jeton de rafraîchissement dans la famille indiquée."""
    raw = secrets.token_urlsafe(32)
    db.add(
        PassengerRefreshToken(
            passenger_id=passenger_id,
            family_id=family_id,
            token_hash=_hash_token(raw),
            client=client,
            device_label=device_label,
            expires_at=utcnow() + timedelta(days=settings.refresh_token_ttl_days),
        )
    )
    await db.flush()
    return raw


# --- Inscription -------------------------------------------------------------------------

async def register(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone: str,
    language: str,
    ip: str | None = None,
) -> Passenger:
    """Crée un compte passager (statut `pending`) et envoie l'e-mail de vérification."""
    actor = Actor("anonymous", None, ip)

    # Limitation de débit par IP
    if await ratelimit.hit(db, f"register:ip:{ip or 'unknown'}", IP_WINDOW_S) > IP_LIMIT:
        raise PassengerError("Trop de tentatives. Réessayez dans quelques minutes.")

    normalized = normalize_email(email)
    try:
        passwords.validate_password(password, email=normalized)
    except passwords.WeakPassword as exc:
        raise PassengerError(str(exc)) from exc

    # Vérification d'unicité (réponse identique pour ne pas révéler si l'e-mail est déjà pris)
    existing = await db.scalar(select(Passenger).where(Passenger.email == normalized))
    if existing is not None:
        # On envoie quand même un e-mail (à l'adresse existante) pour avertir, sans rien révéler à l'appelant.
        await audit(db, actor, "passenger.register.duplicate", "passenger", existing.id)
        # On feint le succès : l'appelant ne sait pas si l'e-mail est déjà enregistré.
        return existing  # le vrai passager, non renvoyé à l'API

    passenger = Passenger(
        email=normalized,
        password_hash=passwords.hash_password(password),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        phone=phone.strip(),
        language=language,
        status="pending",
    )
    db.add(passenger)
    await db.flush()

    raw_token = await _create_one_time_token(db, passenger.id, "email_verify", VERIFY_TTL)
    link = f"{settings.client_url}/compte/verifier-email?token={raw_token}"
    await enqueue_email(
        db,
        to=normalized,
        template="passenger_verify",
        language=language,
        context={"name": first_name.strip(), "link": link},
    )
    await audit(db, actor, "passenger.registered", "passenger", passenger.id)
    return passenger


# --- Vérification d'e-mail ---------------------------------------------------------------

async def verify_email(db: AsyncSession, raw_token: str) -> Passenger:
    """Valide le jeton de vérification d'e-mail et active le compte."""
    found = await _find_one_time_token(db, raw_token, "email_verify", lock=True)
    if found is None:
        raise PassengerError("Ce lien de vérification est invalide ou a expiré.")
    token, passenger = found
    now = utcnow()
    passenger.email_verified_at = now
    # `pending` → `active` uniquement si le compte n'a pas été désactivé entretemps.
    if passenger.status == "pending":
        passenger.status = "active"
    passenger.updated_at = now
    token.used_at = now
    await audit(db, Actor.passenger(passenger.id), "passenger.email_verified", "passenger", passenger.id)
    return passenger


# --- Connexion ---------------------------------------------------------------------------

async def login(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    client: str,
    device_label: str | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
) -> LoginResult:
    """Vérifie les identifiants et émet une paire de jetons (accès + rafraîchissement).

    Toujours retourne un résultat (pas d'exception) pour que les mises à jour `failed_logins`
    soient commitées même en cas d'échec — même pattern que le service admin.
    """
    actor = Actor("anonymous", None, ip, user_agent)
    bucket = f"pax_login:ip:{ip or 'unknown'}"
    if await ratelimit.hit(db, bucket, IP_WINDOW_S) > IP_LIMIT:
        passwords.burn_time(password)
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    try:
        normalized = normalize_email(email)
    except PassengerError:
        passwords.burn_time(password)
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    passenger = await db.scalar(select(Passenger).where(Passenger.email == normalized).with_for_update())
    now = utcnow()

    if passenger is None or passenger.status not in {"active", "pending"} or not passenger.password_hash:
        passwords.burn_time(password)
        await audit(db, actor, "passenger.login.failed", details={"reason": "unknown_or_inactive"})
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    # E-mail non vérifié : connexion bloquée
    if passenger.email_verified_at is None:
        passwords.burn_time(password)
        await audit(db, actor, "passenger.login.failed", "passenger", passenger.id, {"reason": "email_not_verified"})
        return LoginResult(False, error="Vérifiez votre adresse e-mail avant de vous connecter.")

    if passenger.locked_until is not None and passenger.locked_until > now:
        passwords.burn_time(password)
        await audit(db, actor, "passenger.login.failed", "passenger", passenger.id, {"reason": "locked"})
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    if not passwords.verify_password(passenger.password_hash, password):
        passenger.failed_logins += 1
        details: dict[str, Any] = {"reason": "bad_password"}
        if passenger.failed_logins >= LOCK_AFTER_FAILURES:
            delay = min(BASE_LOCK * (2 ** passenger.lockout_count), MAX_LOCK)
            passenger.locked_until = now + delay
            passenger.lockout_count += 1
            passenger.failed_logins = 0
            details["locked_minutes"] = int(delay.total_seconds() // 60)
        passenger.updated_at = now
        await audit(db, actor, "passenger.login.failed", "passenger", passenger.id, details)
        return LoginResult(False, error=GENERIC_LOGIN_ERROR)

    if passwords.needs_rehash(passenger.password_hash):
        passenger.password_hash = passwords.hash_password(password)

    passenger.failed_logins = 0
    passenger.lockout_count = 0
    passenger.locked_until = None
    passenger.last_login_at = now
    passenger.updated_at = now

    # Nouvelle famille de jetons pour cet appareil/navigateur
    family_id = uuid.uuid7()
    raw_refresh = await _new_refresh_token(db, passenger.id, family_id, client, device_label)
    access = _make_access_token(passenger.id)
    await audit(db, Actor.passenger(passenger.id, ip, user_agent), "passenger.login.succeeded", "passenger", passenger.id)  # noqa: E501
    return LoginResult(True, pair=TokenPair(access_token=access, refresh_token=raw_refresh))


# --- Rotation du jeton de rafraîchissement -----------------------------------------------

async def refresh(db: AsyncSession, raw_refresh_token: str) -> RefreshResult:
    """Rotation du jeton de rafraîchissement avec détection de réutilisation (§18.3).

    Toujours retourne un résultat (pas d'exception) pour que les révocations soient commitées
    même en cas d'erreur — même pattern que `login`.
    """
    token_hash = _hash_token(raw_refresh_token)

    # Cherche le jeton (y compris déjà utilisé, pour la détection de réutilisation).
    row = await db.scalar(
        select(PassengerRefreshToken)
        .where(PassengerRefreshToken.token_hash == token_hash)
        .with_for_update()
    )
    if row is None:
        return RefreshResult(False, error="Jeton de rafraîchissement inconnu.")

    now = utcnow()

    # Jeton expiré
    if row.expires_at < now:
        return RefreshResult(False, error="Jeton de rafraîchissement expiré.")

    # Jeton révoqué (famille compromise)
    if row.revoked_at is not None:
        return RefreshResult(False, error="Jeton de rafraîchissement révoqué.")

    # Jeton déjà utilisé → détection de réutilisation
    if row.used_at is not None:
        grace_elapsed = (now - row.used_at).total_seconds()
        if grace_elapsed <= REFRESH_GRACE_S:
            # Tolérance réseau : réponse perdue, on réémet sans révoquer la famille (§18.3 point 4).
            # On révoque les successeurs créés depuis (sauf ce jeton lui-même, déjà marqué used).
            successors = (
                await db.execute(
                    select(PassengerRefreshToken)
                    .where(
                        PassengerRefreshToken.family_id == row.family_id,
                        PassengerRefreshToken.id != row.id,
                        PassengerRefreshToken.created_at > row.used_at,
                        PassengerRefreshToken.revoked_at.is_(None),
                    )
                    .with_for_update()
                )
            ).scalars().all()
            for s in successors:
                s.revoked_at = now
            # Émet une nouvelle paire depuis la même famille.
            passenger_grace = await db.scalar(select(Passenger).where(Passenger.id == row.passenger_id))
            if passenger_grace is None or passenger_grace.status != "active":
                return RefreshResult(False, error="Compte désactivé ou introuvable.")
            raw_new = await _new_refresh_token(db, row.passenger_id, row.family_id, row.client, row.device_label)
            access = _make_access_token(row.passenger_id)
            return RefreshResult(True, pair=TokenPair(access_token=access, refresh_token=raw_new))
        else:
            # Réutilisation tardive : vol probable, on révoque toute la famille dans cette session.
            # On NE lève PAS d'exception : la transaction doit commiter pour persister la révocation.
            await _revoke_family(db, row.family_id)
            await audit(
                db,
                Actor.passenger(row.passenger_id),
                "passenger.token_reuse_detected",
                "passenger",
                row.passenger_id,
                {"family_id": str(row.family_id)},
            )
            return RefreshResult(False, error="Jeton déjà utilisé : famille révoquée pour sécurité.")

    # Vérifie que le passager est toujours actif (§18.3 point 5).
    passenger = await db.scalar(
        select(Passenger).where(Passenger.id == row.passenger_id).with_for_update()
    )
    if passenger is None or passenger.status != "active":
        return RefreshResult(False, error="Compte désactivé ou introuvable.")

    # Rotation normale : marque ce jeton utilisé et crée le successeur.
    row.used_at = now

    raw_new = await _new_refresh_token(db, passenger.id, row.family_id, row.client, row.device_label)
    access = _make_access_token(passenger.id)
    return RefreshResult(True, pair=TokenPair(access_token=access, refresh_token=raw_new))


# --- Déconnexion -------------------------------------------------------------------------

async def logout(db: AsyncSession, passenger_id: uuid.UUID, family_id: uuid.UUID, actor: Actor) -> None:
    """Révoque la famille de jetons de l'appareil (§18.2)."""
    await _revoke_family(db, family_id)
    await audit(db, actor, "passenger.logout", "passenger", passenger_id, {"family_id": str(family_id)})


# --- Mot de passe oublié / réinitialisé --------------------------------------------------

async def forgot_password(db: AsyncSession, email: str, ip: str | None = None) -> None:
    """Envoie un lien de réinitialisation. Réponse identique que l'e-mail existe ou non."""
    actor = Actor("anonymous", None, ip)
    if await ratelimit.hit(db, f"pax_reset:ip:{ip or 'unknown'}", IP_WINDOW_S) > IP_LIMIT:
        return
    try:
        normalized = normalize_email(email)
    except PassengerError:
        return

    passenger = await db.scalar(select(Passenger).where(Passenger.email == normalized))
    if passenger is None or passenger.status not in {"active", "pending"}:
        return

    raw_token = await _create_one_time_token(db, passenger.id, "password_reset", RESET_TTL)
    link = f"{settings.client_url}/compte/reinitialiser-mot-de-passe?token={raw_token}"
    await enqueue_email(
        db,
        to=normalized,
        template="passenger_password_reset",
        language=passenger.language,
        context={"name": passenger.first_name, "link": link},
    )
    await audit(db, actor, "passenger.password.reset_requested", "passenger", passenger.id)


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> Passenger:
    """Réinitialise le mot de passe et révoque toutes les familles de jetons."""
    found = await _find_one_time_token(db, raw_token, "password_reset", lock=True)
    if found is None:
        raise PassengerError("Ce lien est invalide ou a expiré.")
    token, passenger = found
    try:
        passwords.validate_password(new_password, email=str(passenger.email))
    except passwords.WeakPassword as exc:
        raise PassengerError(str(exc)) from exc
    now = utcnow()
    passenger.password_hash = passwords.hash_password(new_password)
    passenger.failed_logins = 0
    passenger.lockout_count = 0
    passenger.locked_until = None
    passenger.updated_at = now
    token.used_at = now
    await _revoke_all_families(db, passenger.id)
    await audit(db, Actor.passenger(passenger.id), "passenger.password.changed", "passenger", passenger.id, {"via": "reset"})  # noqa: E501
    return passenger


# --- Lecture / mise à jour du profil -----------------------------------------------------

async def get_passenger(db: AsyncSession, passenger_id: uuid.UUID) -> Passenger:
    passenger = await db.get(Passenger, passenger_id)
    if passenger is None or passenger.status == "anonymized":
        raise PassengerError("Compte introuvable.")
    return passenger


async def update_profile(
    db: AsyncSession,
    passenger: Passenger,
    *,
    first_name: str | None = None,
    last_name: str | None = None,
    phone: str | None = None,
    language: str | None = None,
    default_needs: dict | None = None,
    health_consent: bool = False,
    clear_needs: bool = False,
) -> Passenger:
    """Met à jour le profil ; les besoins de santé exigent un consentement explicite."""
    if first_name is not None:
        passenger.first_name = first_name.strip()
    if last_name is not None:
        passenger.last_name = last_name.strip()
    if phone is not None:
        passenger.phone = phone.strip()
    if language is not None:
        passenger.language = language
    if clear_needs:
        passenger.default_needs = None
        passenger.health_consent_at = None
    elif default_needs is not None:
        if not health_consent:
            raise PassengerError("Le consentement explicite aux données de santé est requis.")
        passenger.default_needs = default_needs
        passenger.health_consent_at = utcnow()
    passenger.updated_at = utcnow()
    return passenger


async def delete_account(
    db: AsyncSession, passenger: Passenger, password: str, actor: Actor
) -> None:
    """Anonymise le compte (§6.5 / §18.2). Mot de passe requis."""
    if not passwords.verify_password(passenger.password_hash, password):
        raise PassengerError("Mot de passe incorrect.")
    now = utcnow()
    passenger.email = f"anonymized-{passenger.id}@deleted.invalid"
    passenger.password_hash = "!"
    passenger.first_name = "Anonymisé"
    passenger.last_name = ""
    passenger.phone = ""
    passenger.default_needs = None
    passenger.health_consent_at = None
    passenger.status = "anonymized"
    passenger.email_verified_at = None
    passenger.anonymized_at = now
    passenger.updated_at = now
    await _revoke_all_families(db, passenger.id)
    await audit(db, actor, "passenger.deleted", "passenger", passenger.id)


# --- Demandes du passager (lecture seule) ------------------------------------------------

async def list_demandes(
    db: AsyncSession,
    passenger_id: uuid.UUID,
    *,
    scope: str = "upcoming",
    cursor: str | None = None,
    limit: int = 20,
) -> tuple[list[Demande], str | None]:
    """Liste paginée par curseur des demandes du passager (§18.2).

    `scope` : `upcoming` (futures + en cours) | `past` (terminées / annulées / refusées).
    Renvoie (demandes, next_cursor). `next_cursor` vaut None si c'est la dernière page.
    """
    from sqlalchemy import and_, or_

    now = utcnow()
    if scope == "upcoming":
        status_filter = and_(
            Demande.status.in_(["received", "confirmed"]),
            Demande.pickup_at >= now,
        )
    else:
        status_filter = or_(
            Demande.status.in_(["refused", "cancelled", "completed", "not_completed"]),
            and_(Demande.status.in_(["received", "confirmed"]), Demande.pickup_at < now),
        )

    stmt = (
        select(Demande)
        .where(Demande.passenger_id == passenger_id, status_filter)
        .order_by(Demande.pickup_at.desc(), Demande.id.desc())
        .limit(limit + 1)
    )
    if cursor:
        # cursor = "pickup_at_iso|id"
        try:
            parts = cursor.split("|")
            from datetime import UTC, datetime
            cursor_pickup = datetime.fromisoformat(parts[0]).replace(tzinfo=UTC)
            cursor_id = uuid.UUID(parts[1])
            stmt = stmt.where(
                or_(
                    Demande.pickup_at < cursor_pickup,
                    and_(Demande.pickup_at == cursor_pickup, Demande.id < cursor_id),
                )
            )
        except (ValueError, IndexError):
            pass  # curseur invalide, on ignore

    rows = list((await db.execute(stmt)).scalars().all())
    has_more = len(rows) > limit
    rows = rows[:limit]

    next_cursor: str | None = None
    if has_more and rows:
        last = rows[-1]
        next_cursor = f"{last.pickup_at.isoformat()}|{last.id}"

    return rows, next_cursor


async def get_demande(db: AsyncSession, passenger_id: uuid.UUID, demande_id: uuid.UUID) -> Demande:
    """Renvoie une demande appartenant au passager (§18.2 — propriété vérifiée)."""
    d = await db.get(Demande, demande_id)
    if d is None or d.passenger_id != passenger_id:
        raise PassengerError("Demande introuvable.")
    return d
