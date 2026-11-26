"""Routes publiques de l'espace de gestion : connexion, invitation, mot de passe oublié (§6.1)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import same_origin
from app.admin.templating import render
from app.config import settings
from app.db import get_db
from app.domain.admins import service as admins
from app.security.client_ip import client_ip
from app.security.sessions import ABSOLUTE_TIMEOUT

# Routes sans session : seules celles-ci échappent à `require_admin`.
router = APIRouter(dependencies=[Depends(same_origin)])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=int(ABSOLUTE_TIMEOUT.total_seconds()),
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="strict",
    )


@router.get("/login", response_class=HTMLResponse, include_in_schema=False)
async def login_page(request: Request, activated: int = 0, reset: int = 0) -> HTMLResponse:
    notice = None
    if activated:
        notice = "Votre compte est activé. Vous pouvez vous connecter."
    elif reset:
        notice = "Votre mot de passe a été modifié. Connectez-vous avec le nouveau."
    return render(request, "login.html", {"notice": notice, "error": None, "email": ""})


@router.post("/login", response_class=HTMLResponse, include_in_schema=False)
async def login_submit(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    email: Annotated[str, Form(max_length=254)],
    password: Annotated[str, Form(max_length=256)],
) -> Response:
    result = await admins.login(db, email, password, client_ip(request), request.headers.get("user-agent"))
    if not result.ok or result.token is None:
        return render(
            request,
            "login.html",
            {"error": result.error, "notice": None, "email": email},
            status_code=401,
        )
    response = RedirectResponse("/", status_code=303)
    _set_session_cookie(response, result.token)
    return response


@router.get("/invitations/{token}", response_class=HTMLResponse, include_in_schema=False)
async def invitation_page(request: Request, token: str, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    found = await admins.find_token(db, token, "invitation")
    if found is None:
        return render(request, "link_invalid.html", status_code=404)
    return render(
        request,
        "set_password.html",
        {
            "title": "Bienvenue",
            "intro": f"Bonjour {found[1].full_name}, choisissez votre mot de passe.",
            "action": f"/invitations/{token}",
            "error": None,
        },
    )


@router.post("/invitations/{token}", response_class=HTMLResponse, include_in_schema=False)
async def invitation_submit(
    request: Request,
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    password: Annotated[str, Form(max_length=256)],
    confirm: Annotated[str, Form(max_length=256)],
) -> Response:
    page = {"title": "Bienvenue", "intro": "Choisissez votre mot de passe.", "action": f"/invitations/{token}"}
    if password != confirm:
        return render(
            request,
            "set_password.html",
            {**page, "error": "Les deux mots de passe ne correspondent pas."},
            status_code=422,
        )
    try:
        await admins.accept_invitation(db, token, password)
    except admins.AdminError as exc:
        return render(request, "set_password.html", {**page, "error": str(exc)}, status_code=422)
    return RedirectResponse("/login?activated=1", status_code=303)


@router.get("/password/forgot", response_class=HTMLResponse, include_in_schema=False)
async def forgot_page(request: Request) -> HTMLResponse:
    return render(request, "password_forgot.html", {"sent": False})


@router.post("/password/forgot", response_class=HTMLResponse, include_in_schema=False)
async def forgot_submit(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    email: Annotated[str, Form(max_length=254)],
) -> HTMLResponse:
    await admins.request_password_reset(db, email, client_ip(request))
    return render(request, "password_forgot.html", {"sent": True})  # même réponse dans tous les cas


@router.get("/password/reset/{token}", response_class=HTMLResponse, include_in_schema=False)
async def reset_page(request: Request, token: str, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    if await admins.find_token(db, token, "password_reset") is None:
        return render(request, "link_invalid.html", status_code=404)
    return render(
        request,
        "set_password.html",
        {
            "title": "Nouveau mot de passe",
            "intro": "Choisissez un nouveau mot de passe.",
            "action": f"/password/reset/{token}",
            "error": None,
        },
    )


@router.post("/password/reset/{token}", response_class=HTMLResponse, include_in_schema=False)
async def reset_submit(
    request: Request,
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    password: Annotated[str, Form(max_length=256)],
    confirm: Annotated[str, Form(max_length=256)],
) -> Response:
    page = {
        "title": "Nouveau mot de passe",
        "intro": "Choisissez un nouveau mot de passe.",
        "action": f"/password/reset/{token}",
    }
    if password != confirm:
        return render(
            request,
            "set_password.html",
            {**page, "error": "Les deux mots de passe ne correspondent pas."},
            status_code=422,
        )
    try:
        await admins.reset_password(db, token, password)
    except admins.AdminError as exc:
        return render(request, "set_password.html", {**page, "error": str(exc)}, status_code=422)
    return RedirectResponse("/login?reset=1", status_code=303)
