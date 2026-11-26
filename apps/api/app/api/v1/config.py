"""GET /v1/config : valeurs publiques lues par les sites et l'application (§14, §18.2)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.domain.settings.service import get_setting

router = APIRouter(prefix="/config", tags=["config"])


class PublicConfig(BaseModel):
    public_phone: str
    cancellation_deadline_hours: int
    min_lead_minutes: int
    services: list[str]
    mobility_aids: list[str]
    languages: list[str]
    min_supported_app_version: str


@router.get("", response_model=PublicConfig, summary="Configuration publique")
async def read_config(db: Annotated[AsyncSession, Depends(get_db)]) -> PublicConfig:
    return PublicConfig(
        public_phone=await get_setting(db, "company.public_phone"),
        cancellation_deadline_hours=await get_setting(db, "passenger.cancellation_deadline_hours"),
        min_lead_minutes=await get_setting(db, "requests.min_lead_minutes"),
        services=["business", "daily", "vsl", "pmr"],
        mobility_aids=["none", "walking_aid", "manual_wheelchair", "electric_wheelchair", "other"],
        languages=["fr", "nl", "en"],
        min_supported_app_version=await get_setting(db, "mobile.min_supported_version"),
    )
