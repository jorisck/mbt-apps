"""Mon compte : mot de passe, sessions, déconnexion, réauthentification (§6.1, §10.2)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import Auth
from app.admin.templating import render
from app.config import settings
from app.db import get_db
from app.domain.admins import service as admins
from app.domain.audit import audit
from app.models import Admin, AdminSession
from app.security import sessions
from app.timeutil import utcnow

router = APIRouter()


@router.post("/logout", include_in_schema=False)
async def logout(ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> Response:
    await admins.logout(db, ctx.admin, ctx.session, ctx.actor)
    response = RedirectResponse("/login", status_code=303)
    response.delete_cookie(settings.session_cookie_name, path="/")
    return response


@router.post("/auth/step-up", include_in_schema=False)
async def step_up(
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    password: Annotated[str, Form(max_length=256)],
) -> JSONResponse:
    """Appelé par `admin.js` lorsqu'une action sensible répond `403 step_up_required`."""
    ok = await admins.step_up(db, ctx.admin, ctx.session, password, ctx.actor)
    if not ok:  # réponse normale (pas d'exception) : le compteur et l'audit sont conservés
        return JSONResponse({"code": "invalid_password", "detail": "Mot de passe incorrect."}, status_code=403)
    return JSONResponse({"ok": True})


async def _account_context(db: AsyncSession, ctx: Auth) -> dict[str, object]:
    rows = (
        await db.scalars(
            select(AdminSession)
            .where(
                AdminSession.admin_id == ctx.admin.id,
                AdminSession.revoked_at.is_(None),
                AdminSession.expires_at > utcnow(),
            )
            .order_by(AdminSession.last_seen_at.desc())
        )
    ).all()
    return {"sessions": list(rows), "nav": "account", "current_session_id": ctx.session.id}


@router.get("/account", response_class=HTMLResponse, include_in_schema=False)
async def account_page(request: Request, ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    return render(request, "account.html", await _account_context(db, ctx))


@router.post("/account/profile", response_class=HTMLResponse, include_in_schema=False)
async def update_profile(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    full_name: Annotated[str, Form(max_length=100)],
) -> HTMLResponse:
    name = full_name.strip()
    context = await _account_context(db, ctx)
    if not 2 <= len(name) <= 100:
        return render(
            request,
            "account.html",
            {**context, "profile_error": "Le nom doit contenir 2 à 100 caractères."},
            status_code=422,
        )
    await db.execute(update(Admin).where(Admin.id == ctx.admin.id).values(full_name=name, updated_at=utcnow()))
    await audit(db, ctx.actor, "admin.profile_updated", "admin", ctx.admin.id)
    ctx.admin.full_name = name
    request.state.auth_view.admin.full_name = name
    return render(request, "account.html", {**context, "profile_ok": "Nom enregistré."})


@router.post("/account/password", response_class=HTMLResponse, include_in_schema=False)
async def change_password(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[str, Form(max_length=256)],
    new: Annotated[str, Form(max_length=256)],
    confirm: Annotated[str, Form(max_length=256)],
) -> HTMLResponse:
    context = await _account_context(db, ctx)
    if new != confirm:
        return render(
            request,
            "account.html",
            {**context, "password_error": "Les deux mots de passe ne correspondent pas."},
            status_code=422,
        )
    try:
        await admins.change_password(db, ctx.admin, ctx.session, current, new, ctx.actor)
    except admins.AdminError as exc:
        return render(request, "account.html", {**context, "password_error": str(exc)}, status_code=422)
    context = await _account_context(db, ctx)
    return render(
        request, "account.html", {**context, "password_ok": "Mot de passe modifié. Vos autres sessions sont fermées."}
    )


@router.post("/account/sessions/{session_id}/revoke", response_class=HTMLResponse, include_in_schema=False)
async def revoke_session(
    request: Request,
    session_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    target = await db.get(AdminSession, session_id)
    if target is not None and target.admin_id == ctx.admin.id and session_id != ctx.session.id:
        await sessions.revoke_session(db, session_id)
        await audit(db, ctx.actor, "auth.session.revoked", "admin", ctx.admin.id, {"count": 1})
    return RedirectResponse("/account", status_code=303)
