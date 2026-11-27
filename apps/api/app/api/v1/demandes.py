"""POST /v1/demandes : création d'une demande par un invité (site) ou depuis l'application."""

from __future__ import annotations

import hashlib
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import ClientInfo, get_client, version_tuple
from app.db import get_db, session_scope
from app.domain.actors import Actor
from app.domain.demandes.schemas import MIN_ELAPSED_MS, DemandeCreate, DemandeCreated
from app.domain.demandes.service import create_demande
from app.domain.passengers import service as pax
from app.domain.settings.service import get_setting
from app.errors import ApiProblem
from app.models import Passenger
from app.security import ratelimit

router = APIRouter(prefix="/demandes", tags=["demandes"])

# Limites (§18.7) : 5 demandes / 10 min et 20 / jour par IP, 10 / jour par e-mail.
IP_SHORT = (5, 600)
IP_DAY = (20, 86400)
EMAIL_DAY = (10, 86400)


def _generic_refusal() -> ApiProblem:
    # Réponse volontairement générique : on ne dit pas quelle règle anti-spam a joué.
    return ApiProblem(422, "validation_error", "Requête refusée.")


async def _enforce_limits(client: ClientInfo, email: str) -> None:
    """Compteurs dans leur propre transaction : ils restent même si la demande est refusée."""
    email_key = hashlib.sha256(email.lower().encode()).hexdigest()[:24]
    async with session_scope() as db:
        ip = client.ip or "unknown"
        if await ratelimit.hit(db, f"demande:ip10m:{ip}", IP_SHORT[1]) > IP_SHORT[0]:
            raise ApiProblem(429, "rate_limited", "Trop de demandes.", headers={"Retry-After": "600"})
        if await ratelimit.hit(db, f"demande:ipday:{ip}", IP_DAY[1]) > IP_DAY[0]:
            raise ApiProblem(429, "rate_limited", "Trop de demandes.", headers={"Retry-After": "3600"})
        if await ratelimit.hit(db, f"demande:email:{email_key}", EMAIL_DAY[1]) > EMAIL_DAY[0]:
            raise ApiProblem(429, "rate_limited", "Trop de demandes.", headers={"Retry-After": "3600"})


async def _optional_passenger(request: Request, db: AsyncSession) -> Passenger | None:
    """Extrait le passager authentifié si un jeton Bearer valide est présent ; None sinon."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[len("Bearer "):]
    try:
        passenger_id = pax.decode_access_token(token)
    except pax.PassengerError:
        return None
    passenger = await db.get(Passenger, passenger_id)
    if passenger is None or passenger.status != "active":
        return None
    return passenger


@router.post("", response_model=DemandeCreated, status_code=201, summary="Créer une demande")
async def create(
    body: DemandeCreate,
    response: Response,
    request: Request,
    client: Annotated[ClientInfo, Depends(get_client)],
    db: Annotated[AsyncSession, Depends(get_db)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> DemandeCreated:
    try:
        key = str(uuid.UUID(idempotency_key or ""))
    except ValueError:
        raise ApiProblem(422, "idempotency_key_required", "L'en-tête Idempotency-Key (UUID) est obligatoire.") from None

    if client.is_app and client.app_version:
        minimum = str(await get_setting(db, "mobile.min_supported_version"))
        if version_tuple(client.app_version) < version_tuple(minimum):
            raise ApiProblem(426, "app_update_required", "Veuillez mettre l'application à jour.")

    if body.antispam.hp or body.antispam.elapsed_ms < MIN_ELAPSED_MS:
        raise _generic_refusal()
    await _enforce_limits(client, body.passenger.email)

    # Jeton client facultatif : si présent, l'e-mail doit être vérifié (§18.3 point 8).
    passenger = await _optional_passenger(request, db)
    passenger_id = None
    actor = Actor.guest(client.ip)
    if passenger is not None:
        if passenger.email_verified_at is None:
            raise ApiProblem(422, "email_not_verified", "Vérifiez votre adresse e-mail avant de faire une demande.")
        passenger_id = passenger.id
        actor = Actor.passenger(passenger.id, client.ip)

    demande, created = await create_demande(
        db,
        body,
        origin=client.origin,
        idempotency_key=key,
        actor=actor,
        passenger_id=passenger_id,
    )
    if not created:
        response.status_code = 200  # rejeu idempotent : on renvoie la demande déjà créée
    return DemandeCreated(id=str(demande.id), reference=demande.reference, status=demande.status)
