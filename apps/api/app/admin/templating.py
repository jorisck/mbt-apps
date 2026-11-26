"""Jinja2 : gabarits de l'espace de gestion (autoescape actif ; `|safe` interdit sur les saisies)."""

from __future__ import annotations

import hashlib
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.domain.demandes import state_machine as sm
from app.domain.demandes.service import MOBILITY_LABELS, ORIGIN_LABELS, SERVICE_LABELS
from app.timeutil import fmt_brussels, fmt_input_local, utcnow

ADMIN_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(ADMIN_DIR / "templates"))


def _ago(dt: datetime | None) -> str:
    if dt is None:
        return ""
    seconds = int((utcnow() - dt).total_seconds())
    if seconds < 60:
        return "à l'instant"
    minutes = seconds // 60
    if minutes < 60:
        return f"il y a {minutes} min"
    hours = minutes // 60
    if hours < 48:
        return f"il y a {hours} h"
    return f"il y a {hours // 24} j"


def _minutes_since(dt: datetime | None) -> int:
    return 0 if dt is None else int((utcnow() - dt).total_seconds() // 60)


def _digits_tel(phone: str | None) -> str:
    return "".join(ch for ch in (phone or "") if ch.isdigit() or ch == "+")


@lru_cache
def _asset_version(name: str) -> str:
    path = ADMIN_DIR / "static" / name
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8] if path.exists() else "0"  # noqa: S324


def asset(name: str) -> str:
    """URL d'un fichier statique avec empreinte (cache longue durée sans fichier périmé)."""
    return f"/static/{name}?v={_asset_version(name)}"


env = templates.env
env.globals["asset"] = asset
env.globals["handycab_url"] = settings.handycab_url
env.globals["mbttaxis_url"] = settings.mbttaxis_url
env.filters["brussels"] = fmt_brussels
env.filters["input_local"] = fmt_input_local
env.filters["ago"] = _ago
env.filters["minutes_since"] = _minutes_since
env.filters["tel"] = _digits_tel
env.filters["status_label"] = lambda s: sm.STATUS_LABELS.get(s, s)
env.filters["origin_label"] = lambda s: ORIGIN_LABELS.get(s, s)
env.filters["service_label"] = lambda s: SERVICE_LABELS.get(s, s)
env.filters["mobility_label"] = lambda s: MOBILITY_LABELS.get(s, s)
env.globals["STATUS_LABELS"] = sm.STATUS_LABELS
env.globals["ORIGIN_LABELS"] = ORIGIN_LABELS
env.globals["FINAL"] = sm.FINAL


def render(
    request: Request,
    name: str,
    context: dict[str, Any] | None = None,
    status_code: int = 200,
    headers: dict[str, str] | None = None,
) -> HTMLResponse:
    ctx: dict[str, Any] = dict(context or {})
    auth = getattr(request.state, "auth_view", None)
    ctx.setdefault("auth", auth)
    ctx.setdefault("csrf_token", auth.session.csrf_token if auth else "")
    ctx["is_htmx"] = request.headers.get("hx-request") == "true"
    response = templates.TemplateResponse(request, name, ctx, status_code=status_code)
    response.headers["Cache-Control"] = "no-store"
    for key, value in (headers or {}).items():
        response.headers[key] = value
    return response
