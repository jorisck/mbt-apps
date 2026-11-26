"""Liste, fiche et actions sur les demandes (§6.3, §6.4)."""

from __future__ import annotations

import csv
import io
import uuid
from datetime import date
from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Form, Query, Request
from fastapi.responses import HTMLResponse, Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import Auth, StepUp
from app.admin.templating import render
from app.db import get_db
from app.domain.audit import audit
from app.domain.demandes import queries, service
from app.domain.demandes import state_machine as sm
from app.domain.settings.service import get_setting
from app.errors import ApiProblem, BusinessRule
from app.models import Demande
from app.timeutil import fmt_brussels, utcnow

router = APIRouter()

EXPORT_LIMIT = 10_000
ORIGINS = ("site_mbt", "site_handycab", "app_ios", "app_android")
SHORTCUTS = (
    ("", "Toutes"),
    ("a_traiter", "À traiter"),
    ("aujourdhui", "Aujourd'hui"),
    ("demain", "Demain"),
    ("a_regulariser", "À régulariser"),
)


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def build_filters(
    q: str = "",
    status: Annotated[list[str] | None, Query()] = None,
    origin: Annotated[list[str] | None, Query()] = None,
    pickup_from: str | None = None,
    pickup_to: str | None = None,
    received_from: str | None = None,
    received_to: str | None = None,
    account: str = "",
    wheelchair: str = "",
    auto: str = "",
    shortcut: str = "",
    sort: str = "pickup",
    page: int = 1,
) -> queries.DemandeFilters:
    return queries.DemandeFilters(
        q=q[:200],
        statuses=[s for s in (status or []) if s in sm.STATUSES],
        origins=[o for o in (origin or []) if o in ORIGINS],
        pickup_from=_parse_date(pickup_from),
        pickup_to=_parse_date(pickup_to),
        received_from=_parse_date(received_from),
        received_to=_parse_date(received_to),
        has_account={"yes": True, "no": False}.get(account),
        wheelchair=wheelchair == "1",
        auto_closed=auto == "1",
        shortcut=shortcut if shortcut in {s for s, _ in SHORTCUTS} else "",
        sort="received" if sort == "received" else "pickup",
        page=max(1, page),
    )


Filters = Annotated[queries.DemandeFilters, Depends(build_filters)]


@router.get("/demandes", response_class=HTMLResponse, include_in_schema=False)
async def list_page(
    request: Request, ctx: Auth, filters: Filters, db: Annotated[AsyncSession, Depends(get_db)]
) -> HTMLResponse:
    page = await queries.list_demandes(db, filters)
    context = {
        "page": page,
        "f": filters,
        "nav": "demandes",
        "shortcuts": SHORTCUTS,
        "origins": ORIGINS,
        "statuses": sm.STATUSES,
        "base_qs": urlencode([(k, v) for k, v in request.query_params.multi_items() if k != "page"]),
    }
    template = (
        "_demandes_table.html" if request.headers.get("hx-target") == "demandes-results" else "demandes_list.html"
    )
    return render(request, template, context)


_CSV_HEADER = [
    "Référence",
    "Statut",
    "Origine",
    "Service",
    "Prise en charge",
    "Retour",
    "Passager",
    "Téléphone",
    "E-mail",
    "Départ",
    "Destination",
    "Passagers",
    "Reçue le",
]


def _csv_cell(value: object) -> str:
    """Protection contre l'injection de formules (§10.10)."""
    text = "" if value is None else str(value)
    if text and text[0] in {"=", "+", "-", "@", "\t", "\r"}:
        return "'" + text
    return text


@router.get("/demandes/export.csv", include_in_schema=False)
async def export_csv(
    ctx: StepUp,
    filters: Filters,
    db: Annotated[AsyncSession, Depends(get_db)],
    include_health: Annotated[str, Query()] = "",
) -> Response:
    stmt = queries.apply_filters(select(Demande), filters).order_by(Demande.pickup_at).limit(EXPORT_LIMIT)
    rows = list((await db.scalars(stmt)).all())
    with_health = include_health == "1"
    await audit(
        db,
        ctx.actor,
        "demande.exported",
        "demande",
        None,
        {
            "rows": len(rows),
            "include_health": with_health,
            "filters": {"q_set": bool(filters.q), "statuses": filters.statuses, "origins": filters.origins},
        },
    )
    header = list(_CSV_HEADER) + (["Besoins"] if with_health else [])

    def generate():  # noqa: ANN202
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        yield "\ufeff"  # BOM : Excel lit correctement l'UTF-8
        writer.writerow(header)
        yield buffer.getvalue()
        for d in rows:
            buffer.seek(0)
            buffer.truncate()
            line = [
                d.reference,
                sm.STATUS_LABELS[d.status],
                d.origin,
                d.service,
                fmt_brussels(d.pickup_at),
                fmt_brussels(d.return_at) if d.return_at else "",
                f"{d.passenger_first_name or ''} {d.passenger_last_name or ''}".strip(),
                d.passenger_phone,
                d.passenger_email,
                d.pickup_address.get("formatted"),
                d.dropoff_address.get("formatted"),
                d.passenger_count,
                fmt_brussels(d.created_at),
            ]
            if with_health:
                line.append(service.needs_summary(d.needs) if d.needs else "")
            writer.writerow([_csv_cell(cell) for cell in line])
            yield buffer.getvalue()

    return StreamingResponse(
        generate(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="demandes.csv"', "Cache-Control": "no-store"},
    )


# --- Fiche -------------------------------------------------------------------------------


async def _detail_context(db: AsyncSession, ctx: Auth, demande_id: uuid.UUID) -> dict[str, object]:
    detail = await queries.get_detail(db, demande_id)
    if detail is None:
        raise ApiProblem(404, "not_found", "Demande introuvable.")
    d = detail.demande
    now = utcnow()
    window = int(await get_setting(db, "requests.correction_window_days"))
    actions = []
    for to in sm.allowed_targets(d.status, "admin"):
        if to in {"completed", "not_completed"} and d.status == "confirmed":
            if sm.reference_time(d.pickup_at, d.return_at) > now:
                continue
        if d.status in {"completed", "not_completed"}:
            if d.closed_at is None or (now - d.closed_at).days > window:
                continue
        actions.append(to)
    return {
        "detail": detail,
        "d": d,
        "actions": actions,
        "me": ctx.admin,
        "reasons_by_target": {
            "refused": sm.REFUSAL_REASONS,
            "cancelled": sm.CANCELLATION_REASONS,
            "not_completed": (sm.CORRECTION_REASONS if d.status == "completed" else sm.NOT_COMPLETED_REASONS),
            "completed": sm.CORRECTION_REASONS,
        },
        "nav": "demandes",
        "pickup_passed": d.pickup_at < now,
    }


@router.get("/demandes/{demande_id}", response_class=HTMLResponse, include_in_schema=False)
async def detail_page(
    request: Request,
    demande_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    context = await _detail_context(db, ctx, demande_id)
    revision = context["d"].revision  # type: ignore[attr-defined]
    return render(request, "demande_detail.html", context, headers={"ETag": f'"{revision}"'})


async def _render_body(
    request: Request, db: AsyncSession, ctx: Auth, demande_id: uuid.UUID, flash: str | None = None
) -> HTMLResponse:
    context = await _detail_context(db, ctx, demande_id)
    context["flash_ok"] = flash
    revision = context["d"].revision  # type: ignore[attr-defined]
    return render(request, "_demande_body.html", context, headers={"ETag": f'"{revision}"'})


def compose_reason(choice: str, free_text: str, allowed: tuple[str, ...]) -> str:
    choice, free_text = choice.strip(), free_text.strip()
    if choice and choice not in allowed:
        raise BusinessRule("reason_invalid", "Motif inconnu.")
    if not choice and not free_text:
        return ""
    if choice in {"", "Autre"} and not free_text:
        raise BusinessRule("reason_required", "Précisez le motif.")
    if choice in {"", "Autre"}:
        return free_text
    return f"{choice} — {free_text}" if free_text else choice


@router.post("/demandes/{demande_id}/transition", response_class=HTMLResponse, include_in_schema=False)
async def do_transition(
    request: Request,
    demande_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    to: Annotated[str, Form()],
    revision: Annotated[int, Form()],
    reason_choice: Annotated[str, Form(max_length=100)] = "",
    reason_text: Annotated[str, Form(max_length=500)] = "",
) -> HTMLResponse:
    if to not in sm.STATUSES:
        raise ApiProblem(422, "validation_error", "Statut inconnu.")
    allowed = {
        "refused": sm.REFUSAL_REASONS,
        "cancelled": sm.CANCELLATION_REASONS,
        "not_completed": sm.NOT_COMPLETED_REASONS + sm.CORRECTION_REASONS,
        "completed": sm.CORRECTION_REASONS,
    }.get(to, ())
    # Pas de motif pour une confirmation (ni pour une cible invalide, rejetée par le service).
    reason = compose_reason(reason_choice, reason_text, allowed) if allowed else ""
    await service.transition(db, demande_id, to=to, actor=ctx.actor, expected_revision=revision, reason=reason or None)
    return await _render_body(request, db, ctx, demande_id, "Statut mis à jour.")


@router.post("/demandes/{demande_id}/assign", response_class=HTMLResponse, include_in_schema=False)
async def do_assign(
    request: Request,
    demande_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    revision: Annotated[int, Form()],
    release: Annotated[str, Form()] = "",
) -> HTMLResponse:
    await service.assign(
        db,
        demande_id,
        None if release == "1" else ctx.admin.id,
        actor=ctx.actor,
        expected_revision=revision,
    )
    return await _render_body(request, db, ctx, demande_id)


@router.post("/demandes/{demande_id}/notes", response_class=HTMLResponse, include_in_schema=False)
async def add_note(
    request: Request,
    demande_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: Annotated[str, Form(max_length=2000)],
) -> HTMLResponse:
    await service.add_note(db, demande_id, ctx.actor, body)
    return await _render_body(request, db, ctx, demande_id, "Note ajoutée.")


@router.post(
    "/demandes/{demande_id}/notes/{note_id}/delete",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def delete_note(
    request: Request,
    demande_id: uuid.UUID,
    note_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    await service.delete_note(db, note_id, ctx.actor)
    return await _render_body(request, db, ctx, demande_id, "Note supprimée.")
