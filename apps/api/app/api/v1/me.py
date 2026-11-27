"""Routes du compte passager : /v1/me (lot L8, §18.2)."""

from __future__ import annotations

import uuid
from typing import Annotated, Any

import phonenumbers
from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.domain.actors import Actor
from app.domain.demandes import service as dem_service
from app.domain.passengers import service as pax
from app.errors import ApiProblem
from app.models import Demande, Passenger, PassengerAddress
from app.timeutil import fmt_brussels

router = APIRouter(prefix="/me", tags=["me"])


# --- Dépendance d'authentification -------------------------------------------------------

async def get_current_passenger(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Passenger:
    """Extrait et valide le JWT Bearer. Lève 401 si absent ou invalide."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise ApiProblem(401, "authentication_required", "Authentification requise.")
    token = auth[len("Bearer "):]
    try:
        passenger_id = pax.decode_access_token(token)
    except pax.PassengerError as exc:
        raise ApiProblem(401, "invalid_token", str(exc)) from exc
    passenger = await db.get(Passenger, passenger_id)
    if passenger is None or passenger.status != "active":
        raise ApiProblem(401, "account_inactive", "Compte introuvable ou désactivé.")
    return passenger


CurrentPassenger = Annotated[Passenger, Depends(get_current_passenger)]


def _actor(passenger: Passenger, request: Request) -> Actor:
    from app.security.client_ip import client_ip
    return Actor.passenger(passenger.id, client_ip(request), request.headers.get("user-agent"))


# --- Schémas -----------------------------------------------------------------------------

class AddressOut(BaseModel):
    id: str
    label: str
    address: dict[str, Any]
    created_at: str


class AddressIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    label: str = Field(min_length=1, max_length=80)
    address: dict[str, Any]


class ProfileOut(BaseModel):
    id: str
    email: str
    email_verified: bool
    first_name: str
    last_name: str
    phone: str
    language: str
    default_needs: dict[str, Any] | None
    status: str
    created_at: str


class ProfilePatch(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    phone: str | None = Field(default=None, min_length=6, max_length=30)
    language: str | None = None
    default_needs: dict[str, Any] | None = None
    health_consent: bool = False
    clear_needs: bool = False

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            parsed = phonenumbers.parse(v, "BE")
        except phonenumbers.NumberParseException:
            raise ValueError("Numéro de téléphone invalide.") from None
        if not phonenumbers.is_possible_number(parsed):
            raise ValueError("Numéro de téléphone invalide.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

    @field_validator("language")
    @classmethod
    def _lang(cls, v: str | None) -> str | None:
        if v is not None and v not in ("fr", "nl", "en"):
            raise ValueError("Langue non supportée.")
        return v


class DeleteAccountIn(BaseModel):
    password: str


class DemandeOut(BaseModel):
    id: str
    reference: str
    status: str
    service: str
    pickup_at: str
    pickup_address: dict[str, Any]
    dropoff_address: dict[str, Any]
    return_at: str | None
    passenger_count: int
    refusal_reason: str | None
    cancellation_reason: str | None
    revision: int
    created_at: str


class DemandeListOut(BaseModel):
    items: list[DemandeOut]
    next_cursor: str | None


class CancelIn(BaseModel):
    reason: str | None = None


def _demande_out(d: Demande) -> DemandeOut:
    return DemandeOut(
        id=str(d.id),
        reference=d.reference,
        status=d.status,
        service=d.service,
        pickup_at=fmt_brussels(d.pickup_at),
        pickup_address=d.pickup_address,
        dropoff_address=d.dropoff_address,
        return_at=fmt_brussels(d.return_at) if d.return_at else None,
        passenger_count=d.passenger_count,
        refusal_reason=d.refusal_reason,
        cancellation_reason=d.cancellation_reason,
        revision=d.revision,
        created_at=fmt_brussels(d.created_at),
    )


def _profile_out(p: Passenger) -> ProfileOut:
    return ProfileOut(
        id=str(p.id),
        email=str(p.email),
        email_verified=p.email_verified_at is not None,
        first_name=p.first_name,
        last_name=p.last_name,
        phone=p.phone,
        language=p.language,
        default_needs=p.default_needs,
        status=p.status,
        created_at=fmt_brussels(p.created_at),
    )


# --- Profil ------------------------------------------------------------------------------

@router.get("", response_model=ProfileOut, summary="Profil du passager connecté")
async def get_me(passenger: CurrentPassenger) -> ProfileOut:
    return _profile_out(passenger)


@router.patch("", response_model=ProfileOut, summary="Mise à jour du profil")
async def patch_me(
    body: ProfilePatch,
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOut:
    try:
        await pax.update_profile(
            db,
            passenger,
            first_name=body.first_name,
            last_name=body.last_name,
            phone=body.phone,
            language=body.language,
            default_needs=body.default_needs,
            health_consent=body.health_consent,
            clear_needs=body.clear_needs,
        )
    except pax.PassengerError as exc:
        raise ApiProblem(422, "profile_error", str(exc)) from exc
    return _profile_out(passenger)


@router.delete("", status_code=204, summary="Suppression du compte (anonymisation)")
async def delete_me(
    body: DeleteAccountIn,
    passenger: CurrentPassenger,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await pax.delete_account(db, passenger, body.password, _actor(passenger, request))
    except pax.PassengerError as exc:
        raise ApiProblem(422, "account_error", str(exc)) from exc


# --- Adresses favorites ------------------------------------------------------------------

@router.get("/addresses", response_model=list[AddressOut], summary="Adresses favorites")
async def list_addresses(
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AddressOut]:
    rows = list(
        (
            await db.execute(
                select(PassengerAddress)
                .where(PassengerAddress.passenger_id == passenger.id)
                .order_by(PassengerAddress.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [
        AddressOut(
            id=str(r.id),
            label=r.label,
            address=r.address,
            created_at=fmt_brussels(r.created_at),
        )
        for r in rows
    ]


@router.post("/addresses", response_model=AddressOut, status_code=201, summary="Ajouter une adresse favorite")
async def add_address(
    body: AddressIn,
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AddressOut:
    addr = PassengerAddress(passenger_id=passenger.id, label=body.label, address=body.address)
    db.add(addr)
    await db.flush()
    return AddressOut(
        id=str(addr.id),
        label=addr.label,
        address=addr.address,
        created_at=fmt_brussels(addr.created_at),
    )


@router.delete("/addresses/{address_id}", status_code=204, summary="Supprimer une adresse favorite")
async def delete_address(
    address_id: uuid.UUID,
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    row = await db.get(PassengerAddress, address_id)
    if row is None or row.passenger_id != passenger.id:
        raise ApiProblem(404, "not_found", "Adresse introuvable.")
    await db.delete(row)


# --- Export RGPD -------------------------------------------------------------------------

@router.get("/export", summary="Export des données personnelles (RGPD)")
async def export_me(
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    addresses = list(
        (
            await db.execute(
                select(PassengerAddress).where(PassengerAddress.passenger_id == passenger.id)
            )
        )
        .scalars()
        .all()
    )
    demandes = list(
        (
            await db.execute(
                select(Demande)
                .where(Demande.passenger_id == passenger.id)
                .order_by(Demande.pickup_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return {
        "profile": _profile_out(passenger).model_dump(),
        "addresses": [
            {"id": str(a.id), "label": a.label, "address": a.address, "created_at": fmt_brussels(a.created_at)}
            for a in addresses
        ],
        "demandes": [_demande_out(d).model_dump() for d in demandes],
    }


# --- Demandes du passager ----------------------------------------------------------------

@router.get("/demandes", response_model=DemandeListOut, summary="Liste des demandes (curseur)")
async def list_my_demandes(
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
    scope: str = "upcoming",
    cursor: str | None = None,
    limit: int = 20,
) -> DemandeListOut:
    if scope not in ("upcoming", "past"):
        scope = "upcoming"
    limit = min(max(1, limit), 50)
    rows, next_cursor = await pax.list_demandes(db, passenger.id, scope=scope, cursor=cursor, limit=limit)
    return DemandeListOut(items=[_demande_out(d) for d in rows], next_cursor=next_cursor)


@router.get("/demandes/{demande_id}", response_model=DemandeOut, summary="Détail d'une demande")
async def get_my_demande(
    demande_id: uuid.UUID,
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DemandeOut:
    try:
        d = await pax.get_demande(db, passenger.id, demande_id)
    except pax.PassengerError as exc:
        raise ApiProblem(404, "not_found", str(exc)) from exc
    return _demande_out(d)


@router.post(
    "/demandes/{demande_id}/cancel",
    response_model=DemandeOut,
    summary="Annuler une demande (T4, T6)",
)
async def cancel_my_demande(
    demande_id: uuid.UUID,
    body: CancelIn,
    passenger: CurrentPassenger,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> DemandeOut:
    # Vérifie la propriété avant la transition
    try:
        await pax.get_demande(db, passenger.id, demande_id)
    except pax.PassengerError as exc:
        raise ApiProblem(404, "not_found", str(exc)) from exc

    expected_revision: int | None = None
    if if_match is not None:
        try:
            expected_revision = int(if_match.strip('"'))
        except ValueError:
            raise ApiProblem(422, "invalid_if_match", "L'en-tête If-Match doit être la révision entière.") from None

    actor = _actor(passenger, request)
    d = await dem_service.transition(
        db,
        demande_id,
        to="cancelled",
        actor=actor,
        expected_revision=expected_revision,
        reason=body.reason,
    )
    return _demande_out(d)


@router.post(
    "/demandes/{demande_id}/repeat",
    summary="Répéter une demande (brouillon pré-rempli, sans créer)",
)
async def repeat_my_demande(
    demande_id: uuid.UUID,
    passenger: CurrentPassenger,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Renvoie un brouillon pré-rempli à partir d'une demande existante, sans créer de nouvelle demande."""
    try:
        d = await pax.get_demande(db, passenger.id, demande_id)
    except pax.PassengerError as exc:
        raise ApiProblem(404, "not_found", str(exc)) from exc

    # Brouillon sans date : le passager devra saisir pickup_at avant de soumettre.
    draft: dict[str, Any] = {
        "service": d.service,
        "pickup_at": None,
        "pickup": {"formatted": d.pickup_address.get("formatted", ""), "place_id": d.pickup_address.get("place_id")},
        "dropoff": {"formatted": d.dropoff_address.get("formatted", ""), "place_id": d.dropoff_address.get("place_id")},
        "passenger_count": d.passenger_count,
        "needs": d.needs,
        "comment": d.comment,
        "passenger": {
            "first_name": passenger.first_name,
            "last_name": passenger.last_name,
            "phone": passenger.phone,
            "email": str(passenger.email),
            "language": passenger.language,
        },
    }
    return {"draft": draft, "based_on": str(d.id)}
