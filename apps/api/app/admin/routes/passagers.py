"""Liste, fiche et actions sur les comptes passagers (§6.5)."""

from __future__ import annotations

import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, Query, Request
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import Auth, StepUp
from app.admin.templating import render
from app.db import get_db
from app.domain.passengers import admin_service as svc

router = APIRouter()


# --- Helpers de rendu --------------------------------------------------------------------


async def _list_page(
    request: Request,
    db: AsyncSession,
    ctx: Auth,
    q: str = "",
    page: int = 1,
    *,
    error: str | None = None,
    ok: str | None = None,
    status_code: int = 200,
) -> HTMLResponse:
    ppage = await svc.list_passengers(db, q=q, page=page)
    return render(
        request,
        "passagers_list.html",
        {"ppage": ppage, "q": q, "nav": "passagers", "error": error, "ok": ok},
        status_code=status_code,
    )


async def _detail_page(
    request: Request,
    db: AsyncSession,
    ctx: Auth,
    passenger_id: uuid.UUID,
    *,
    error: str | None = None,
    ok: str | None = None,
    status_code: int = 200,
) -> HTMLResponse:
    detail = await svc.get_detail(db, passenger_id)
    return render(
        request,
        "passager_detail.html",
        {"detail": detail, "p": detail.passenger, "nav": "passagers", "error": error, "ok": ok},
        status_code=status_code,
    )


# --- Routes GET --------------------------------------------------------------------------


@router.get("/passagers", response_class=HTMLResponse, include_in_schema=False)
async def list_page(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    q: Annotated[str, Query()] = "",
    page: Annotated[int, Query(ge=1)] = 1,
) -> HTMLResponse:
    return await _list_page(request, db, ctx, q=q, page=page)


@router.get("/passagers/{passenger_id}", response_class=HTMLResponse, include_in_schema=False)
async def detail_page(
    request: Request,
    passenger_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    return await _detail_page(request, db, ctx, passenger_id)


# --- Routes POST : actions sans step-up --------------------------------------------------


@router.post("/passagers/{passenger_id}/disable", response_class=HTMLResponse, include_in_schema=False)
async def disable(
    request: Request,
    passenger_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    try:
        await svc.set_enabled(db, ctx.actor, passenger_id, enabled=False)
    except svc.PassengerAdminError as exc:
        return await _detail_page(request, db, ctx, passenger_id, error=str(exc), status_code=422)
    return await _detail_page(request, db, ctx, passenger_id, ok="Compte désactivé, jetons révoqués.")


@router.post("/passagers/{passenger_id}/enable", response_class=HTMLResponse, include_in_schema=False)
async def enable(
    request: Request,
    passenger_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    try:
        await svc.set_enabled(db, ctx.actor, passenger_id, enabled=True)
    except svc.PassengerAdminError as exc:
        return await _detail_page(request, db, ctx, passenger_id, error=str(exc), status_code=422)
    return await _detail_page(request, db, ctx, passenger_id, ok="Compte réactivé.")


@router.post(
    "/passagers/{passenger_id}/resend-verification",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def resend_verification(
    request: Request,
    passenger_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    try:
        await svc.resend_verification(db, ctx.actor, passenger_id)
    except svc.PassengerAdminError as exc:
        return await _detail_page(request, db, ctx, passenger_id, error=str(exc), status_code=422)
    return await _detail_page(request, db, ctx, passenger_id, ok="E-mail de vérification renvoyé.")


# --- Routes avec step-up -----------------------------------------------------------------


@router.get("/passagers/{passenger_id}/export", include_in_schema=False)
async def export_json(
    passenger_id: uuid.UUID,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    data = await svc.export_json(db, ctx.actor, passenger_id)
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    return Response(
        content=payload,
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="passager-{passenger_id}.json"',
            "Cache-Control": "no-store",
        },
    )


@router.post(
    "/passagers/{passenger_id}/anonymize",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def anonymize(
    request: Request,
    passenger_id: uuid.UUID,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
    confirm: Annotated[str, Form(max_length=20)] = "",
) -> HTMLResponse:
    try:
        await svc.anonymize(db, ctx.actor, passenger_id, confirm)
    except svc.PassengerAdminError as exc:
        return await _detail_page(request, db, ctx, passenger_id, error=str(exc), status_code=422)
    # Après anonymisation, retourner à la liste avec confirmation
    ppage = await svc.list_passengers(db)
    return render(
        request,
        "passagers_list.html",
        {
            "ppage": ppage,
            "q": "",
            "nav": "passagers",
            "ok": "Compte anonymisé avec succès.",
        },
    )
