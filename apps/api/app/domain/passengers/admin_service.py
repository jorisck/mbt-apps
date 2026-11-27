"""Helpers d'administration des comptes passagers (§6.5).

Toutes les règles métier de l'espace de gestion sont ici ; les routes restent minces.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import Text, cast, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.domain.actors import Actor
from app.domain.audit import audit
from app.domain.emails.outbox import enqueue_email
from app.errors import ApiProblem
from app.models import Demande, Passenger, PassengerAddress, PassengerRefreshToken, PassengerToken
from app.timeutil import utcnow

PAGE_SIZE = 50
CONFIRM_WORD = "ANONYMISER"
VERIFY_TTL = timedelta(hours=24)


# --- Exceptions métier -------------------------------------------------------------------


class PassengerAdminError(Exception):
    """Erreur métier affichable à l'admin."""


# --- Schémas de résultat -----------------------------------------------------------------


@dataclass
class PassengerRow:
    passenger: Passenger
    demande_count: int
    last_demande_at: datetime | None


@dataclass
class PassengerPage:
    rows: list[PassengerRow]
    total: int
    page: int
    page_size: int = PAGE_SIZE

    @property
    def total_pages(self) -> int:
        return max(1, (self.total + self.page_size - 1) // self.page_size)

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        return self.page > 1


@dataclass
class PassengerDetail:
    passenger: Passenger
    addresses: list[PassengerAddress]
    demandes: list[Demande]


# --- Helpers privés ----------------------------------------------------------------------


def _hash_token(raw: str) -> bytes:
    return hashlib.sha256(raw.encode()).digest()


async def _create_verification_token(db: AsyncSession, passenger_id: uuid.UUID) -> str:
    """Crée un jeton de vérification d'e-mail à usage unique."""
    raw = secrets.token_urlsafe(32)
    db.add(
        PassengerToken(
            passenger_id=passenger_id,
            purpose="email_verify",
            token_hash=_hash_token(raw),
            expires_at=utcnow() + VERIFY_TTL,
        )
    )
    await db.flush()
    return raw


async def _revoke_refresh_tokens(db: AsyncSession, passenger_id: uuid.UUID) -> int:
    """Révoque tous les jetons de rafraîchissement actifs d'un passager."""
    rows = list(
        (
            await db.execute(
                select(PassengerRefreshToken)
                .where(
                    PassengerRefreshToken.passenger_id == passenger_id,
                    PassengerRefreshToken.revoked_at.is_(None),
                )
                .with_for_update()
            )
        )
        .scalars()
        .all()
    )
    now = utcnow()
    for row in rows:
        row.revoked_at = now
    return len(rows)


async def _has_upcoming_active_demandes(db: AsyncSession, passenger_id: uuid.UUID) -> bool:
    """Vérifie s'il existe des demandes actives (received/confirmed) à venir."""
    count = await db.scalar(
        select(func.count())
        .select_from(Demande)
        .where(
            Demande.passenger_id == passenger_id,
            Demande.status.in_(["received", "confirmed"]),
            Demande.pickup_at > utcnow(),
        )
    )
    return int(count or 0) > 0


# --- Fonctions publiques -----------------------------------------------------------------


async def list_passengers(
    db: AsyncSession, q: str = "", page: int = 1
) -> PassengerPage:
    """Liste paginée des passagers, avec recherche par nom / e-mail / téléphone."""
    q = q.strip()[:200]
    page = max(1, page)

    base = select(Passenger).where(Passenger.status != "anonymized")

    if q:
        ilike = f"%{q}%"
        base = base.where(
            or_(
                Passenger.first_name.ilike(ilike),
                Passenger.last_name.ilike(ilike),
                cast(Passenger.email, Text).ilike(ilike),
                Passenger.phone.ilike(ilike),
            )
        )

    total = int(await db.scalar(select(func.count()).select_from(base.subquery())) or 0)

    offset = (page - 1) * PAGE_SIZE
    passengers = list(
        (
            await db.scalars(
                base.order_by(Passenger.created_at.desc()).limit(PAGE_SIZE).offset(offset)
            )
        ).all()
    )

    # Comptage par passager (N+1 acceptable pour une liste paginée de PAGE_SIZE=50)
    rows: list[PassengerRow] = []
    for p in passengers:
        count = int(
            await db.scalar(
                select(func.count()).select_from(Demande).where(Demande.passenger_id == p.id)
            )
            or 0
        )
        last_at: datetime | None = await db.scalar(
            select(func.max(Demande.pickup_at)).where(Demande.passenger_id == p.id)
        )
        rows.append(PassengerRow(passenger=p, demande_count=count, last_demande_at=last_at))

    return PassengerPage(rows=rows, total=total, page=page)


async def get_detail(db: AsyncSession, passenger_id: uuid.UUID) -> PassengerDetail:
    """Fiche complète (profil, adresses favorites, 20 dernières demandes)."""
    passenger = await db.get(Passenger, passenger_id)
    if passenger is None or passenger.status == "anonymized":
        raise ApiProblem(404, "not_found", "Passager introuvable.")

    addresses = list(
        (
            await db.scalars(
                select(PassengerAddress)
                .where(PassengerAddress.passenger_id == passenger_id)
                .order_by(PassengerAddress.created_at.desc())
            )
        ).all()
    )

    demandes = list(
        (
            await db.scalars(
                select(Demande)
                .where(Demande.passenger_id == passenger_id)
                .order_by(Demande.pickup_at.desc())
                .limit(20)
            )
        ).all()
    )

    return PassengerDetail(passenger=passenger, addresses=addresses, demandes=demandes)


async def set_enabled(
    db: AsyncSession, actor: Actor, passenger_id: uuid.UUID, *, enabled: bool
) -> Passenger:
    """Désactive ou réactive un compte passager. La désactivation révoque tous les jetons."""
    passenger = await db.scalar(
        select(Passenger).where(Passenger.id == passenger_id).with_for_update()
    )
    if passenger is None or passenger.status == "anonymized":
        raise PassengerAdminError("Passager introuvable.")

    now = utcnow()
    if enabled:
        if passenger.status != "disabled":
            raise PassengerAdminError("Ce compte n'est pas désactivé.")
        passenger.status = "active" if passenger.email_verified_at else "pending"
        passenger.updated_at = now
        await audit(db, actor, "passenger.enabled", "passenger", passenger_id)
    else:
        if passenger.status not in {"active", "pending"}:
            raise PassengerAdminError("Ce compte est déjà désactivé.")
        passenger.status = "disabled"
        passenger.updated_at = now
        revoked = await _revoke_refresh_tokens(db, passenger_id)
        await audit(
            db, actor, "passenger.disabled", "passenger", passenger_id,
            {"tokens_revoked": revoked},
        )

    return passenger


async def resend_verification(
    db: AsyncSession, actor: Actor, passenger_id: uuid.UUID
) -> None:
    """Renvoie l'e-mail de vérification (§6.5). Expire les anciens jetons en attente."""
    passenger = await db.scalar(
        select(Passenger).where(Passenger.id == passenger_id).with_for_update()
    )
    if passenger is None or passenger.status == "anonymized":
        raise PassengerAdminError("Passager introuvable.")
    if passenger.email_verified_at is not None:
        raise PassengerAdminError("L'adresse e-mail est déjà vérifiée.")

    # Expire les anciens jetons de vérification non utilisés
    old_tokens = list(
        (
            await db.execute(
                select(PassengerToken).where(
                    PassengerToken.passenger_id == passenger_id,
                    PassengerToken.purpose == "email_verify",
                    PassengerToken.used_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )
    now = utcnow()
    for t in old_tokens:
        t.expires_at = now  # invalide immédiatement

    raw_token = await _create_verification_token(db, passenger_id)
    link = f"{settings.client_url}/compte/verifier-email?token={raw_token}"
    await enqueue_email(
        db,
        to=str(passenger.email),
        template="passenger_verify",
        language=passenger.language,
        context={"name": passenger.first_name, "link": link},
    )
    await audit(db, actor, "passenger.verification_resent", "passenger", passenger_id)


async def export_json(
    db: AsyncSession, actor: Actor, passenger_id: uuid.UUID
) -> dict[str, Any]:
    """Export RGPD au format JSON (§6.5). Journalisé."""
    detail = await get_detail(db, passenger_id)
    p = detail.passenger

    await audit(db, actor, "passenger.exported", "passenger", passenger_id)

    return {
        "passenger": {
            "id": str(p.id),
            "email": str(p.email),
            "first_name": p.first_name,
            "last_name": p.last_name,
            "phone": p.phone,
            "language": p.language,
            "status": p.status,
            "email_verified_at": p.email_verified_at.isoformat() if p.email_verified_at else None,
            "last_login_at": p.last_login_at.isoformat() if p.last_login_at else None,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        },
        "addresses": [
            {
                "id": str(a.id),
                "label": a.label,
                "address": a.address,
                "created_at": a.created_at.isoformat(),
            }
            for a in detail.addresses
        ],
        "demandes": [
            {
                "id": str(d.id),
                "reference": d.reference,
                "status": d.status,
                "service": d.service,
                "pickup_at": d.pickup_at.isoformat(),
                "pickup_address": d.pickup_address.get("formatted") if d.pickup_address else None,
                "created_at": d.created_at.isoformat(),
            }
            for d in detail.demandes
        ],
    }


async def anonymize(
    db: AsyncSession,
    actor: Actor,
    passenger_id: uuid.UUID,
    confirm: str,
) -> None:
    """Anonymise le compte et toutes ses demandes (§6.5).

    - ``confirm`` doit valoir ``ANONYMISER``
    - Bloqué si une demande ``received`` ou ``confirmed`` à venir existe
    - Irréversible
    """
    if confirm.strip() != CONFIRM_WORD:
        raise PassengerAdminError(f"Saisissez « {CONFIRM_WORD} » pour confirmer.")

    passenger = await db.scalar(
        select(Passenger).where(Passenger.id == passenger_id).with_for_update()
    )
    if passenger is None or passenger.status == "anonymized":
        raise PassengerAdminError("Passager introuvable.")

    if await _has_upcoming_active_demandes(db, passenger_id):
        raise PassengerAdminError(
            "Ce passager a des demandes reçues ou confirmées à venir. "
            "Annulez ou clôturez-les avant d'anonymiser."
        )

    now = utcnow()

    # --- Anonymiser le compte ---
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

    # --- Révoquer tous les jetons de rafraîchissement ---
    await _revoke_refresh_tokens(db, passenger_id)

    # --- Supprimer les adresses favorites ---
    addresses = list(
        (
            await db.scalars(
                select(PassengerAddress).where(PassengerAddress.passenger_id == passenger_id)
            )
        ).all()
    )
    for addr in addresses:
        await db.delete(addr)

    # --- Anonymiser les demandes (PII seulement) ---
    # passenger_id mis à NULL pour déconnecter l'historique du compte anonymisé.
    # synchronize_session=False : bypass la synchronisation ORM (pas de Demande chargé ici).
    await db.execute(
        update(Demande)
        .where(Demande.passenger_id == passenger_id)
        .values(
            passenger_first_name="Anonymisé",
            passenger_last_name="",
            passenger_phone="",
            passenger_email=None,
            passenger_id=None,
            anonymized_at=now,
            updated_at=now,
        )
        .execution_options(synchronize_session=False)
    )

    await audit(db, actor, "passenger.anonymized", "passenger", passenger_id)
