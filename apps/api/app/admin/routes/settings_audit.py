"""Paramètres (§6.7) et journal d'audit (§6.8)."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import Auth, StepUp
from app.admin.templating import render
from app.db import get_db
from app.domain.audit import audit, verify_chain
from app.domain.settings import service as settings_service
from app.models import Admin, AuditLog

router = APIRouter()
AUDIT_PAGE_SIZE = 50


def _form_value(value: Any, kind: str) -> str:
    if kind == "emails":
        return ", ".join(value)
    if kind == "bool":
        return "1" if value else "0"
    return str(value)


async def _settings_context(db: AsyncSession) -> dict[str, Any]:
    values = await settings_service.get_all(db)
    rows = [
        {"definition": d, "value": _form_value(values[key], d.kind), "checked": bool(values[key])}
        for key, d in settings_service.DEFINITIONS.items()
    ]
    return {"rows": rows, "nav": "settings"}


@router.get("/settings", response_class=HTMLResponse, include_in_schema=False)
async def settings_page(request: Request, ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    return render(request, "settings.html", await _settings_context(db))


@router.post("/settings", response_class=HTMLResponse, include_in_schema=False)
async def settings_save(request: Request, ctx: StepUp, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    form = await request.form()
    current = await settings_service.get_all(db)
    errors: dict[str, str] = {}
    changes: dict[str, Any] = {}
    for key, definition in settings_service.DEFINITIONS.items():
        raw: Any = form.get(f"s:{key}")
        if definition.kind == "bool":
            raw = "1" if raw == "1" else "0"  # case non cochée : champ absent
        elif raw is None:
            continue
        try:
            value = settings_service.validate(key, raw)
        except ValueError as exc:
            errors[key] = str(exc)
            continue
        if value != current[key]:
            changes[key] = value
    if errors:
        context = await _settings_context(db)
        for row in context["rows"]:
            key = row["definition"].key
            if key in errors:
                row["error"] = errors[key]
            raw = form.get(f"s:{key}")
            if isinstance(raw, str) and row["definition"].kind != "bool":
                row["value"] = raw
        return render(request, "settings.html", {**context, "error": "Corrigez les champs signalés."}, status_code=422)
    for key, value in changes.items():
        before, after = await settings_service.set_setting(db, key, value, ctx.admin.id)
        await audit(db, ctx.actor, "settings.updated", "setting", key, {"key": key, "before": before, "after": after})
    context = await _settings_context(db)
    message = "Paramètres enregistrés." if changes else "Aucun changement."
    return render(request, "settings.html", {**context, "ok": message})


@router.get("/audit-log", response_class=HTMLResponse, include_in_schema=False)
async def audit_page(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    action: str = "",
    page: int = 1,
) -> HTMLResponse:
    page = max(1, page)
    action = action.strip()[:80]
    base = select(AuditLog)
    if action:
        base = base.where(AuditLog.action.startswith(action, autoescape=True))
    total = int(await db.scalar(select(func.count()).select_from(base.subquery())) or 0)
    rows = (
        await db.execute(
            base.add_columns(Admin.full_name)
            .outerjoin(Admin, Admin.id == AuditLog.actor_id)
            .order_by(AuditLog.id.desc())
            .limit(AUDIT_PAGE_SIZE)
            .offset((page - 1) * AUDIT_PAGE_SIZE)
        )
    ).all()
    return render(
        request,
        "audit.html",
        {
            "rows": rows,
            "page": page,
            "total": total,
            "action": action,
            "nav": "audit",
            "pages": max(1, -(-total // AUDIT_PAGE_SIZE)),
            "verified": None,
        },
    )


@router.post("/audit-log/verify", response_class=HTMLResponse, include_in_schema=False)
async def audit_verify(request: Request, ctx: Auth, db: Annotated[AsyncSession, Depends(get_db)]) -> HTMLResponse:
    ok, broken_id = await verify_chain(db)
    return render(request, "_audit_verify.html", {"ok": ok, "broken_id": broken_id})
