"""POST /v1/messages : formulaires hors course (contact, devis, adaptation, location-vente)."""

from __future__ import annotations

import hashlib
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import ClientInfo, get_client
from app.db import get_db, session_scope
from app.domain.actors import Actor
from app.domain.demandes.schemas import MIN_ELAPSED_MS
from app.domain.messages.schemas import MessageCreate, MessageCreated
from app.domain.messages.service import create_message
from app.errors import ApiProblem
from app.security import ratelimit

router = APIRouter(prefix="/messages", tags=["messages"])

IP_SHORT = (10, 600)
IP_DAY = (30, 86400)
EMAIL_DAY = (10, 86400)


def _generic_refusal() -> ApiProblem:
    return ApiProblem(422, "validation_error", "Requête refusée.")


async def _enforce_limits(client: ClientInfo, email: str) -> None:
    email_key = hashlib.sha256(email.lower().encode()).hexdigest()[:24]
    async with session_scope() as db:
        ip = client.ip or "unknown"
        if await ratelimit.hit(db, f"message:ip10m:{ip}", IP_SHORT[1]) > IP_SHORT[0]:
            raise ApiProblem(429, "rate_limited", "Trop de messages.", headers={"Retry-After": "600"})
        if await ratelimit.hit(db, f"message:ipday:{ip}", IP_DAY[1]) > IP_DAY[0]:
            raise ApiProblem(429, "rate_limited", "Trop de messages.", headers={"Retry-After": "3600"})
        if await ratelimit.hit(db, f"message:email:{email_key}", EMAIL_DAY[1]) > EMAIL_DAY[0]:
            raise ApiProblem(429, "rate_limited", "Trop de messages.", headers={"Retry-After": "3600"})


@router.post("", response_model=MessageCreated, status_code=201, summary="Envoyer un message")
async def create(
    body: MessageCreate,
    client: Annotated[ClientInfo, Depends(get_client)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageCreated:
    if client.is_app:
        raise ApiProblem(403, "forbidden", "Cette route est réservée aux sites.")
    if body.antispam.hp or body.antispam.elapsed_ms < MIN_ELAPSED_MS:
        raise _generic_refusal()
    await _enforce_limits(client, body.email)
    await create_message(
        db, body, origin=client.origin, actor=Actor.guest(client.ip)
    )
    return MessageCreated()
