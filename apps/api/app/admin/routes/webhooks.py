"""Connexions (endpoints webhooks) et journal d'envois (§8.3–§8.9)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, Query, Request
from fastapi.responses import HTMLResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.deps import Auth, StepUp
from app.admin.templating import render
from app.db import get_db
from app.domain.webhooks import service as svc
from app.errors import ApiProblem
from app.models import WebhookAttempt, WebhookDelivery, WebhookEndpoint
from app.timeutil import utcnow

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers communs
# ---------------------------------------------------------------------------


def _redirect(url: str) -> Response:
    return Response(status_code=303, headers={"Location": url})


def _parse_events(form_data: dict[str, list[str]]) -> list[str]:
    return [e for e in form_data.get("events", []) if e in svc.WEBHOOK_EVENTS]


def _parse_custom_headers(raw: str) -> dict[str, str] | None:
    """Analyse `Key: Value` (une par ligne). Retourne None si vide."""
    result: dict[str, str] = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        if ":" not in line:
            raise ValueError(f"En-tête invalide : {line!r} (attendu « Clé: Valeur »)")
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if not key:
            raise ValueError("Le nom d'en-tête ne peut pas être vide.")
        result[key] = value
    return result if result else None


# ---------------------------------------------------------------------------
# /connexions — liste
# ---------------------------------------------------------------------------


@router.get("/connexions", response_class=HTMLResponse, include_in_schema=False)
async def connexions_list(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    endpoints = list(
        (
            await db.scalars(
                select(WebhookEndpoint).order_by(WebhookEndpoint.created_at.desc())
            )
        ).all()
    )
    return render(
        request,
        "connexions_list.html",
        {
            "endpoints": endpoints,
            "nav": "connexions",
            "ENDPOINT_STATUS_LABELS": svc.ENDPOINT_STATUS_LABELS,
            "EVENT_LABELS": svc.EVENT_LABELS,
        },
    )


# ---------------------------------------------------------------------------
# /connexions/nouveau — wizard 3 étapes
# ---------------------------------------------------------------------------


@router.get("/connexions/nouveau", response_class=HTMLResponse, include_in_schema=False)
async def connexion_create_step1(request: Request, ctx: Auth) -> HTMLResponse:
    return render(request, "connexion_create.html", {"step": 1, "nav": "connexions"})


@router.post("/connexions/nouveau/step2", response_class=HTMLResponse, include_in_schema=False)
async def connexion_create_step2(
    request: Request,
    ctx: Auth,
    name: Annotated[str, Form(max_length=100)],
    url: Annotated[str, Form(max_length=2048)],
) -> HTMLResponse:
    from app.domain.webhooks.url_policy import InvalidURL

    try:
        validated_url, _ = __import__(
            "app.domain.webhooks.url_policy", fromlist=["validate_endpoint_url"]
        ).validate_endpoint_url(url)
    except InvalidURL as exc:
        return render(
            request,
            "connexion_create.html",
            {"step": 1, "nav": "connexions", "error": exc.detail, "name": name, "url": url},
            status_code=422,
        )

    return render(
        request,
        "connexion_create.html",
        {
            "step": 2,
            "nav": "connexions",
            "name": name,
            "url": validated_url,
            "WEBHOOK_EVENTS": svc.WEBHOOK_EVENTS,
            "EVENT_LABELS": svc.EVENT_LABELS,
        },
    )


@router.post("/connexions/nouveau/step3", response_class=HTMLResponse, include_in_schema=False)
async def connexion_create_step3(
    request: Request,
    ctx: Auth,
    name: Annotated[str, Form(max_length=100)],
    url: Annotated[str, Form(max_length=2048)],
    include_health_data: Annotated[str, Form()] = "",
    custom_headers_raw: Annotated[str, Form(max_length=2000)] = "",
) -> HTMLResponse:
    form = await request.form()
    events = [v for k, v in form.multi_items() if k == "events"]
    health = include_health_data == "1"

    try:
        headers = _parse_custom_headers(custom_headers_raw)
    except ValueError as exc:
        return render(
            request,
            "connexion_create.html",
            {
                "step": 2,
                "nav": "connexions",
                "name": name,
                "url": url,
                "error": str(exc),
                "events": events,
                "include_health_data": health,
                "custom_headers_raw": custom_headers_raw,
                "WEBHOOK_EVENTS": svc.WEBHOOK_EVENTS,
                "EVENT_LABELS": svc.EVENT_LABELS,
            },
            status_code=422,
        )

    return render(
        request,
        "connexion_create.html",
        {
            "step": 3,
            "nav": "connexions",
            "name": name,
            "url": url,
            "events": events,
            "include_health_data": health,
            "custom_headers_raw": custom_headers_raw,
            "headers_preview": headers,
            "WEBHOOK_EVENTS": svc.WEBHOOK_EVENTS,
            "EVENT_LABELS": svc.EVENT_LABELS,
        },
    )


@router.post("/connexions", response_class=HTMLResponse, include_in_schema=False)
async def connexion_create(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    name: Annotated[str, Form(max_length=100)],
    url: Annotated[str, Form(max_length=2048)],
    include_health_data: Annotated[str, Form()] = "",
    custom_headers_raw: Annotated[str, Form(max_length=2000)] = "",
) -> HTMLResponse:
    form = await request.form()
    events = [v for k, v in form.multi_items() if k == "events"]
    try:
        headers = _parse_custom_headers(custom_headers_raw)
        endpoint, secret = await svc.create_endpoint(
            db,
            name=name,
            url=url,
            events=events,
            include_health_data=include_health_data == "1",
            custom_headers=headers,
            actor=ctx.actor,
        )
    except ApiProblem as exc:
        return render(
            request,
            "connexion_create.html",
            {
                "step": 3,
                "nav": "connexions",
                "name": name,
                "url": url,
                "events": events,
                "include_health_data": include_health_data == "1",
                "custom_headers_raw": custom_headers_raw,
                "error": exc.detail,
                "WEBHOOK_EVENTS": svc.WEBHOOK_EVENTS,
                "EVENT_LABELS": svc.EVENT_LABELS,
            },
            status_code=422,
        )

    return render(
        request,
        "connexion_detail.html",
        {
            "endpoint": endpoint,
            "nav": "connexions",
            "new_secret": secret,
            "ENDPOINT_STATUS_LABELS": svc.ENDPOINT_STATUS_LABELS,
            "EVENT_LABELS": svc.EVENT_LABELS,
            "flash_ok": "Connexion créée. Copiez le secret maintenant — il ne sera plus affiché.",
        },
    )


# ---------------------------------------------------------------------------
# /connexions/{id} — fiche
# ---------------------------------------------------------------------------


async def _detail_context(
    db: AsyncSession,
    endpoint_id: uuid.UUID,
    *,
    flash_ok: str | None = None,
    new_secret: str | None = None,
) -> dict:
    endpoint = await db.get(WebhookEndpoint, endpoint_id)
    if endpoint is None:
        raise ApiProblem(404, "not_found", "Connexion introuvable.")
    # Derniers envois (20 max)
    deliveries = list(
        (
            await db.scalars(
                select(WebhookDelivery)
                .where(WebhookDelivery.endpoint_id == endpoint_id)
                .order_by(WebhookDelivery.created_at.desc())
                .limit(20)
            )
        ).all()
    )
    now = utcnow()
    can_activate = (
        endpoint.status == "inactive"
        and endpoint.last_test_ok is True
        and endpoint.last_test_at is not None
        and (now - endpoint.last_test_at) <= svc.TEST_VALIDITY
    )
    return {
        "endpoint": endpoint,
        "deliveries": deliveries,
        "can_activate": can_activate,
        "nav": "connexions",
        "flash_ok": flash_ok,
        "new_secret": new_secret,
        "ENDPOINT_STATUS_LABELS": svc.ENDPOINT_STATUS_LABELS,
        "DELIVERY_STATUS_LABELS": svc.DELIVERY_STATUS_LABELS,
        "EVENT_LABELS": svc.EVENT_LABELS,
        "WEBHOOK_EVENTS": svc.WEBHOOK_EVENTS,
    }


@router.get("/connexions/{endpoint_id}", response_class=HTMLResponse, include_in_schema=False)
async def connexion_detail(
    request: Request,
    endpoint_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    context = await _detail_context(db, endpoint_id)
    return render(request, "connexion_detail.html", context)


@router.post(
    "/connexions/{endpoint_id}/test",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def connexion_test(
    request: Request,
    endpoint_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    _, result = await svc.send_test(db, endpoint_id, ctx.actor)
    msg = (
        f"Test réussi (HTTP {result.http_status}, {result.duration_ms} ms)."
        if result.success
        else f"Test échoué : {result.error_type or 'erreur inconnue'} (HTTP {result.http_status})."
    )
    context = await _detail_context(db, endpoint_id, flash_ok=msg if result.success else None)
    if not result.success:
        context["flash_error"] = msg
    return render(request, "connexion_detail.html", context, status_code=200 if result.success else 422)


@router.post(
    "/connexions/{endpoint_id}/activate",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def connexion_activate(
    request: Request,
    endpoint_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    await svc.activate_endpoint(db, endpoint_id, ctx.actor)
    context = await _detail_context(db, endpoint_id, flash_ok="Connexion activée.")
    return render(request, "connexion_detail.html", context)


@router.post(
    "/connexions/{endpoint_id}/deactivate",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def connexion_deactivate(
    request: Request,
    endpoint_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    await svc.deactivate_endpoint(db, endpoint_id, ctx.actor)
    context = await _detail_context(db, endpoint_id, flash_ok="Connexion désactivée.")
    return render(request, "connexion_detail.html", context)


@router.post(
    "/connexions/{endpoint_id}/rotate-secret",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def connexion_rotate_secret(
    request: Request,
    endpoint_id: uuid.UUID,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
    urgent: Annotated[str, Form()] = "",
) -> HTMLResponse:
    _, new_secret = await svc.rotate_secret(db, endpoint_id, ctx.actor, urgent=urgent == "1")
    context = await _detail_context(
        db,
        endpoint_id,
        flash_ok="Secret renouvelé. Copiez-le maintenant — il ne sera plus affiché.",
        new_secret=new_secret,
    )
    return render(request, "connexion_detail.html", context)


@router.post(
    "/connexions/{endpoint_id}/archive",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def connexion_archive(
    request: Request,
    endpoint_id: uuid.UUID,
    ctx: StepUp,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    await svc.archive_endpoint(db, endpoint_id, ctx.actor)
    return _redirect("/connexions")


@router.post(
    "/connexions/{endpoint_id}/update",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def connexion_update(
    request: Request,
    endpoint_id: uuid.UUID,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    name: Annotated[str, Form(max_length=100)] = "",
    url: Annotated[str, Form(max_length=2048)] = "",
    include_health_data: Annotated[str, Form()] = "",
    custom_headers_raw: Annotated[str, Form(max_length=2000)] = "",
    clear_custom_headers: Annotated[str, Form()] = "",
) -> HTMLResponse:
    form = await request.form()
    events = [v for k, v in form.multi_items() if k == "events"]
    try:
        headers = _parse_custom_headers(custom_headers_raw) if not (clear_custom_headers == "1") else None
        await svc.update_endpoint(
            db,
            endpoint_id,
            name=name or None,
            url=url or None,
            events=events if events else None,
            include_health_data=True if include_health_data == "1" else False,
            custom_headers=headers,
            clear_custom_headers=clear_custom_headers == "1",
            actor=ctx.actor,
        )
    except ApiProblem as exc:
        context = await _detail_context(db, endpoint_id)
        context["flash_error"] = exc.detail
        return render(request, "connexion_detail.html", context, status_code=422)
    context = await _detail_context(db, endpoint_id, flash_ok="Connexion mise à jour.")
    return render(request, "connexion_detail.html", context)


# ---------------------------------------------------------------------------
# /envois — journal des livraisons
# ---------------------------------------------------------------------------


@router.get("/envois", response_class=HTMLResponse, include_in_schema=False)
async def envois_list(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    endpoint_id: Annotated[str, Query()] = "",
    status: Annotated[str, Query()] = "",
    event_type: Annotated[str, Query()] = "",
    page: Annotated[int, Query(ge=1)] = 1,
) -> HTMLResponse:
    eid = None
    if endpoint_id:
        try:
            eid = uuid.UUID(endpoint_id)
        except ValueError:
            pass

    page_data = await svc.list_deliveries(
        db,
        endpoint_id=eid,
        status=status or None,
        event_type=event_type or None,
        page=page,
    )
    endpoints = list(
        (await db.scalars(select(WebhookEndpoint).order_by(WebhookEndpoint.name))).all()
    )
    return render(
        request,
        "envois_list.html",
        {
            "page": page_data,
            "endpoints": endpoints,
            "f_endpoint_id": endpoint_id,
            "f_status": status,
            "f_event_type": event_type,
            "f_page": page,
            "nav": "connexions",
            "DELIVERY_STATUS_LABELS": svc.DELIVERY_STATUS_LABELS,
            "EVENT_LABELS": svc.EVENT_LABELS,
            "WEBHOOK_EVENTS": svc.WEBHOOK_EVENTS,
        },
    )


@router.get("/envois/{delivery_id:path}", response_class=HTMLResponse, include_in_schema=False)
async def envoi_detail(
    request: Request,
    delivery_id: str,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    delivery = await db.get(WebhookDelivery, delivery_id)
    if delivery is None:
        raise ApiProblem(404, "not_found", "Envoi introuvable.")
    endpoint = await db.get(WebhookEndpoint, delivery.endpoint_id)
    attempts = list(
        (
            await db.scalars(
                select(WebhookAttempt)
                .where(WebhookAttempt.delivery_id == delivery_id)
                .order_by(WebhookAttempt.created_at.desc())
            )
        ).all()
    )
    return render(
        request,
        "envoi_detail.html",
        {
            "delivery": delivery,
            "endpoint": endpoint,
            "attempts": attempts,
            "nav": "connexions",
            "DELIVERY_STATUS_LABELS": svc.DELIVERY_STATUS_LABELS,
            "EVENT_LABELS": svc.EVENT_LABELS,
        },
    )


@router.post("/envois/{delivery_id:path}/retry", response_class=HTMLResponse, include_in_schema=False)
async def envoi_retry(
    request: Request,
    delivery_id: str,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    await svc.retry_delivery(db, delivery_id, ctx.actor)
    return _redirect(f"/envois/{delivery_id}")


@router.post("/envois/{delivery_id:path}/abandon", response_class=HTMLResponse, include_in_schema=False)
async def envoi_abandon(
    request: Request,
    delivery_id: str,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HTMLResponse:
    await svc.abandon_delivery(db, delivery_id, ctx.actor)
    return _redirect(f"/envois/{delivery_id}")


@router.post("/envois-bulk-retry", response_class=HTMLResponse, include_in_schema=False)
async def envois_bulk_retry(
    request: Request,
    ctx: Auth,
    db: Annotated[AsyncSession, Depends(get_db)],
    endpoint_id: Annotated[str, Form()] = "",
) -> HTMLResponse:
    eid = None
    if endpoint_id:
        try:
            eid = uuid.UUID(endpoint_id)
        except ValueError:
            pass
    await svc.bulk_retry_failed(db, endpoint_id=eid, actor=ctx.actor)
    qs = f"?endpoint_id={endpoint_id}" if endpoint_id else ""
    return _redirect(f"/envois{qs}")
