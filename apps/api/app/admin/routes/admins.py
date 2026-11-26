"""Gestion des administrateurs (§6.6). Toutes les écritures exigent une réauthentification."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import Auth, StepUp
from app.admin.templating import render
from app.db import get_db
from app.domain.admins import service as admins
from app.models import Admin

router = APIRouter()


async def _page(
    request: Request,
    db: AsyncSession,
    ctx: Auth,
    *,
    error: str | None = None,
    ok: str | None = None,
    status_code: int = 200,
) -> HTMLResponse:
    rows = (await db.scalars(select(Admin).order_by(Admin.created_at))).all()
    return render(
        request,
        "admins.html",
        {"admins": list(rows), "nav": "admins", "error": error, "ok": ok},
        status_code=status_code,
    )


@router.get("/admins", response_class=HTMLResponse, include_in_schema=False)
async def list_admins(request: Request, ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    return await _page(request, db, ctx)


@router.post("/admins/invitations", response_class=HTMLResponse, include_in_schema=False)
async def invite(
    request: Request,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
    email: Annotated[str, Form(max_length=254)],
    full_name: Annotated[str, Form(max_length=100)],
) -> HTMLResponse:
    try:
        await admins.invite_admin(db, ctx.actor, email, full_name)
    except admins.AdminError as exc:
        return await _page(request, db, ctx, error=str(exc), status_code=422)
    return await _page(request, db, ctx, ok="Invitation envoyée (valable 72 heures).")


@router.post("/admins/{admin_id}/disable", response_class=HTMLResponse, include_in_schema=False)
async def disable(
    request: Request,
    admin_id: uuid.UUID,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    try:
        await admins.set_admin_enabled(db, ctx.actor, admin_id, False)
    except admins.AdminError as exc:
        return await _page(request, db, ctx, error=str(exc), status_code=422)
    return await _page(request, db, ctx, ok="Compte désactivé, sessions fermées.")


@router.post("/admins/{admin_id}/enable", response_class=HTMLResponse, include_in_schema=False)
async def enable(
    request: Request,
    admin_id: uuid.UUID,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    try:
        await admins.set_admin_enabled(db, ctx.actor, admin_id, True)
    except admins.AdminError as exc:
        return await _page(request, db, ctx, error=str(exc), status_code=422)
    return await _page(request, db, ctx, ok="Compte réactivé.")


@router.post("/admins/{admin_id}/revoke-sessions", response_class=HTMLResponse, include_in_schema=False)
async def revoke_sessions(
    request: Request,
    admin_id: uuid.UUID,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    count = await admins.revoke_admin_sessions(db, ctx.actor, admin_id)
    return await _page(request, db, ctx, ok=f"{count} session(s) fermée(s).")
