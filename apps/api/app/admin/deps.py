"""Dépendances de l'espace de gestion : session, CSRF, réauthentification (§10)."""

from __future__ import annotations

import hmac
from dataclasses import dataclass
from types import SimpleNamespace
from typing import Annotated
from urllib.parse import urlsplit

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.domain.actors import Actor
from app.errors import ApiProblem
from app.models import Admin, AdminSession
from app.security import sessions
from app.security.client_ip import client_ip


class AuthRequired(Exception):  # noqa: N818
    """Aucune session valide : 401."""


class StepUpRequired(ApiProblem):
    def __init__(self) -> None:
        super().__init__(403, "step_up_required", "Saisissez votre mot de passe pour confirmer cette action.")


@dataclass
class AuthContext:
    admin: Admin
    session: AdminSession
    actor: Actor
    ip: str | None


async def require_admin(request: Request, db: Annotated[AsyncSession, Depends(get_db)]) -> AuthContext:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise AuthRequired
    loaded = await sessions.load_session(db, token)
    if loaded is None:
        raise AuthRequired
    session, admin = loaded
    ip = client_ip(request)
    ctx = AuthContext(
        admin=admin,
        session=session,
        actor=Actor.admin(admin.id, ip, request.headers.get("user-agent")),
        ip=ip,
    )
    request.state.auth = ctx
    # Copie « inerte » pour l'affichage : reste lisible même après un rollback (page d'erreur).
    request.state.auth_view = SimpleNamespace(
        admin=SimpleNamespace(id=admin.id, full_name=admin.full_name, email=str(admin.email)),
        session=SimpleNamespace(id=session.id, csrf_token=session.csrf_token),
    )
    return ctx


Auth = Annotated[AuthContext, Depends(require_admin)]


def check_same_origin(request: Request) -> None:
    """Vérifie `Origin` et `Sec-Fetch-Site` sur les requêtes qui modifient quelque chose (§10.7).

    Avec `Referrer-Policy: no-referrer` (imposé par §10.7), les navigateurs envoient
    `Origin: null` sur un POST de formulaire, y compris vers le même site. Un `null` n'est donc
    pas refusé d'office : on exige alors `Sec-Fetch-Site: same-origin`, que le navigateur pose
    lui-même et qu'une page tierce ne peut pas falsifier.
    """
    origin = request.headers.get("origin")
    site = request.headers.get("sec-fetch-site")
    if origin == "null":
        if site in {"same-origin", "none"}:
            return
        raise ApiProblem(403, "csrf_origin", "Origine refusée.")
    if origin:
        if urlsplit(origin).netloc != request.headers.get("host", ""):
            raise ApiProblem(403, "csrf_origin", "Origine refusée.")
        return
    if site and site not in {"same-origin", "none"}:
        raise ApiProblem(403, "csrf_origin", "Origine refusée.")


async def same_origin(request: Request) -> None:
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        check_same_origin(request)


async def csrf_protect(request: Request, ctx: Auth) -> None:
    """Jeton synchronisé : en-tête `X-CSRF-Token` (HTMX) ou champ caché `csrf_token`."""
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    check_same_origin(request)
    presented = request.headers.get("x-csrf-token")
    if not presented:
        content_type = request.headers.get("content-type", "")
        if "form" in content_type:
            form = await request.form()
            value = form.get("csrf_token")
            presented = value if isinstance(value, str) else None
    if not presented or not hmac.compare_digest(presented, ctx.session.csrf_token):
        raise ApiProblem(403, "csrf_invalid", "Jeton CSRF invalide : rechargez la page.")


async def require_step_up(ctx: Auth) -> AuthContext:
    """Actions sensibles : mot de passe ressaisi dans les 10 dernières minutes."""
    if not sessions.has_step_up(ctx.session):
        raise StepUpRequired
    return ctx


StepUp = Annotated[AuthContext, Depends(require_step_up)]
