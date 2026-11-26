"""Tableau de bord et état du système (§6.2)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import Auth
from app.admin.templating import render
from app.db import get_db
from app.domain.demandes import queries
from app.models import EmailOutbox
from app.timeutil import utcnow

router = APIRouter()


@router.get("/", response_class=HTMLResponse, include_in_schema=False)
async def dashboard_page(request: Request, ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    data = await queries.dashboard(db)
    return render(request, "dashboard.html", {"d": data, "nav": "dashboard"})


@router.get("/fragments/dashboard", response_class=HTMLResponse, include_in_schema=False)
async def dashboard_fragment(request: Request, ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    """Rafraîchi toutes les 30 s par HTMX."""
    data = await queries.dashboard(db)
    return render(request, "_dashboard_blocks.html", {"d": data})


@router.get("/system/status", include_in_schema=False)
async def system_status(ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> JSONResponse:
    data = await queries.dashboard(db)
    pending_emails = int(
        await db.scalar(select(func.count()).select_from(EmailOutbox).where(EmailOutbox.status == "pending")) or 0
    )
    return JSONResponse(
        {
            "worker_ok": data.worker_ok,
            "worker_seen_at": data.worker_seen_at.isoformat() if data.worker_seen_at else None,
            "pending_emails": pending_emails,
            "failed_emails": data.failed_emails,
            "server_time": utcnow().isoformat(),
        }
    )
