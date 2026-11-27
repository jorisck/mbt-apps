"""CRUD et actions sur les endpoints webhooks (§8.3–§8.9).

Flux de vie d'un endpoint :
  inactive → (test réussi < 24 h) → active → inactive / archived
  secret : rotation progressive (ancien secret valide 7 j) ou urgente (invalidation immédiate).

Flux de vie d'un envoi :
  pending → sending → succeeded / failed / abandoned
  Un envoi échoué peut être relancé (retry) ou abandonné.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.actors import Actor
from app.domain.audit import audit
from app.domain.webhooks.outbox import (
    _headers_aad,
    _new_delivery_id,
    _secret_aad,
    build_send_headers,
)
from app.domain.webhooks.payload import build_test_payload
from app.domain.webhooks.sender import AttemptResult
from app.domain.webhooks.sender import deliver as http_deliver
from app.domain.webhooks.signing import generate_secret
from app.domain.webhooks.url_policy import validate_endpoint_url
from app.errors import ApiProblem, BusinessRule
from app.models import WebhookAttempt, WebhookDelivery, WebhookEndpoint
from app.security.crypto import get_keyring
from app.timeutil import utcnow

log = structlog.get_logger("webhooks.service")

PAGE_SIZE = 20
SECRET_PREV_TTL = timedelta(days=7)
TEST_VALIDITY = timedelta(hours=24)

# Événements auxquels un endpoint peut s'abonner.
WEBHOOK_EVENTS: list[str] = [
    "demande.received",
    "demande.confirmed",
    "demande.refused",
    "demande.cancelled",
    "demande.completed",
    "demande.not_completed",
]

EVENT_LABELS: dict[str, str] = {
    "demande.received": "Demande reçue",
    "demande.confirmed": "Demande confirmée",
    "demande.refused": "Demande refusée",
    "demande.cancelled": "Demande annulée",
    "demande.completed": "Demande effectuée",
    "demande.not_completed": "Demande non effectuée",
}

DELIVERY_STATUS_LABELS: dict[str, str] = {
    "pending": "En attente",
    "sending": "En cours",
    "succeeded": "Réussi",
    "failed": "Échoué",
    "abandoned": "Abandonné",
}

ENDPOINT_STATUS_LABELS: dict[str, str] = {
    "inactive": "Inactif",
    "active": "Actif",
    "archived": "Archivé",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _encrypt_secret(endpoint_id: uuid.UUID, secret: str) -> bytes:
    return get_keyring().encrypt(secret.encode(), _secret_aad(endpoint_id))


def _encrypt_headers(endpoint_id: uuid.UUID, headers: dict[str, str]) -> bytes:
    return get_keyring().encrypt(json.dumps(headers).encode(), _headers_aad(endpoint_id))


async def _get_or_404(db: AsyncSession, endpoint_id: uuid.UUID) -> WebhookEndpoint:
    endpoint = await db.get(WebhookEndpoint, endpoint_id)
    if endpoint is None:
        raise ApiProblem(404, "not_found", "Connexion introuvable.")
    return endpoint


def _check_not_archived(endpoint: WebhookEndpoint) -> None:
    if endpoint.status == "archived":
        raise BusinessRule("endpoint_archived", "Cette connexion est archivée.")


# ---------------------------------------------------------------------------
# Endpoints CRUD
# ---------------------------------------------------------------------------


async def create_endpoint(
    db: AsyncSession,
    *,
    name: str,
    url: str,
    events: list[str],
    include_health_data: bool = False,
    custom_headers: dict[str, str] | None = None,
    actor: Actor,
) -> tuple[WebhookEndpoint, str]:
    """Crée un endpoint et retourne (endpoint, secret_clair) pour affichage unique."""
    validated_url, _ = validate_endpoint_url(url)
    invalid = [e for e in events if e not in WEBHOOK_EVENTS]
    if invalid:
        raise BusinessRule("invalid_events", f"Événements inconnus : {', '.join(invalid)}")
    if not events:
        raise BusinessRule("events_required", "Sélectionnez au moins un événement.")

    endpoint_id = uuid.uuid7()
    secret = generate_secret()
    secret_enc = _encrypt_secret(endpoint_id, secret)
    custom_headers_enc = _encrypt_headers(endpoint_id, custom_headers) if custom_headers else None

    endpoint = WebhookEndpoint(
        id=endpoint_id,
        name=name.strip(),
        url=validated_url,
        events=events,
        include_health_data=include_health_data,
        secret_enc=secret_enc,
        custom_headers_enc=custom_headers_enc,
        status="inactive",
        created_by=actor.id,
    )
    db.add(endpoint)
    await db.flush()
    await audit(
        db,
        actor,
        "webhook_endpoint.created",
        "webhook_endpoint",
        endpoint_id,
        {"name": name, "url": validated_url, "events": events},
    )
    return endpoint, secret


async def send_test(
    db: AsyncSession,
    endpoint_id: uuid.UUID,
    actor: Actor,
) -> tuple[WebhookDelivery, AttemptResult]:
    """Envoie un événement de test synchrone ; met à jour last_test_ok."""
    endpoint = await _get_or_404(db, endpoint_id)
    _check_not_archived(endpoint)

    payload = build_test_payload()
    delivery_id = _new_delivery_id()
    delivery = WebhookDelivery(
        id=delivery_id,
        endpoint_id=endpoint_id,
        demande_id=None,
        event_type="webhook.test",
        payload=payload,
        trigger="test",
        status="sending",
    )
    db.add(delivery)
    await db.flush()

    body = json.dumps(payload, ensure_ascii=False).encode()
    headers = build_send_headers(endpoint, delivery_id, body)
    result = await http_deliver(endpoint.url, body, headers)

    attempt = WebhookAttempt(
        delivery_id=delivery_id,
        trigger="test",
        triggered_by=actor.id,
        resolved_ip=result.resolved_ip,
        http_status=result.http_status,
        error_type=result.error_type,
        response_excerpt=result.response_excerpt,
        duration_ms=result.duration_ms,
    )
    db.add(attempt)

    delivery.attempt_count = 1
    delivery.lease_until = None
    if result.success:
        delivery.status = "succeeded"
    else:
        delivery.status = "failed"
        delivery.last_error = result.error_type

    now = utcnow()
    endpoint.last_test_at = now
    endpoint.last_test_ok = result.success
    endpoint.updated_at = now

    await audit(
        db,
        actor,
        "webhook_endpoint.tested",
        "webhook_endpoint",
        endpoint_id,
        {"success": result.success, "http_status": result.http_status, "error": result.error_type},
    )
    return delivery, result


async def activate_endpoint(
    db: AsyncSession,
    endpoint_id: uuid.UUID,
    actor: Actor,
) -> WebhookEndpoint:
    """Active l'endpoint si un test a réussi dans les 24 h (§8.7)."""
    endpoint = await _get_or_404(db, endpoint_id)
    _check_not_archived(endpoint)
    if endpoint.status == "active":
        return endpoint

    if not endpoint.last_test_ok:
        raise BusinessRule(
            "test_required",
            "Un test doit réussir avant d'activer la connexion.",
        )
    if endpoint.last_test_at is None or (utcnow() - endpoint.last_test_at) > TEST_VALIDITY:
        raise BusinessRule(
            "test_expired",
            "Le test de connexion a expiré (plus de 24 h). Veuillez tester à nouveau.",
        )

    endpoint.status = "active"
    endpoint.updated_at = utcnow()
    await audit(db, actor, "webhook_endpoint.activated", "webhook_endpoint", endpoint_id, {})
    return endpoint


async def deactivate_endpoint(
    db: AsyncSession,
    endpoint_id: uuid.UUID,
    actor: Actor,
) -> WebhookEndpoint:
    """Désactive l'endpoint (pas de step-up requis)."""
    endpoint = await _get_or_404(db, endpoint_id)
    _check_not_archived(endpoint)
    endpoint.status = "inactive"
    endpoint.updated_at = utcnow()
    await audit(db, actor, "webhook_endpoint.deactivated", "webhook_endpoint", endpoint_id, {})
    return endpoint


async def update_endpoint(
    db: AsyncSession,
    endpoint_id: uuid.UUID,
    *,
    name: str | None = None,
    url: str | None = None,
    events: list[str] | None = None,
    include_health_data: bool | None = None,
    custom_headers: dict[str, str] | None = None,
    clear_custom_headers: bool = False,
    actor: Actor,
) -> WebhookEndpoint:
    """Met à jour les champs modifiables. Changer l'URL invalide le test."""
    endpoint = await _get_or_404(db, endpoint_id)
    _check_not_archived(endpoint)

    changes: dict[str, Any] = {}
    if name is not None and name.strip() != endpoint.name:
        endpoint.name = name.strip()
        changes["name"] = endpoint.name
    if url is not None:
        validated_url, _ = validate_endpoint_url(url)
        if validated_url != endpoint.url:
            endpoint.url = validated_url
            endpoint.last_test_ok = None
            endpoint.last_test_at = None
            changes["url"] = validated_url
    if events is not None:
        invalid = [e for e in events if e not in WEBHOOK_EVENTS]
        if invalid:
            raise BusinessRule("invalid_events", f"Événements inconnus : {', '.join(invalid)}")
        if not events:
            raise BusinessRule("events_required", "Sélectionnez au moins un événement.")
        endpoint.events = events
        changes["events"] = events
    if include_health_data is not None:
        endpoint.include_health_data = include_health_data
        changes["include_health_data"] = include_health_data
    if clear_custom_headers:
        endpoint.custom_headers_enc = None
        changes["custom_headers"] = "cleared"
    elif custom_headers is not None:
        endpoint.custom_headers_enc = _encrypt_headers(endpoint_id, custom_headers)
        changes["custom_headers"] = "updated"

    endpoint.updated_at = utcnow()
    await audit(db, actor, "webhook_endpoint.updated", "webhook_endpoint", endpoint_id, changes)
    return endpoint


async def rotate_secret(
    db: AsyncSession,
    endpoint_id: uuid.UUID,
    actor: Actor,
    *,
    urgent: bool = False,
) -> tuple[WebhookEndpoint, str]:
    """Rotation de secret.

    Progressive (défaut) : ancien secret valide 7 j pendant la migration des intégrations.
    Urgente : invalidation immédiate de l'ancien secret.
    Retourne (endpoint, nouveau_secret_clair).
    """
    endpoint = await _get_or_404(db, endpoint_id)
    _check_not_archived(endpoint)

    new_secret = generate_secret()
    if not urgent:
        endpoint.secret_prev_enc = endpoint.secret_enc
        endpoint.secret_prev_expires_at = utcnow() + SECRET_PREV_TTL
    else:
        endpoint.secret_prev_enc = None
        endpoint.secret_prev_expires_at = None

    endpoint.secret_enc = _encrypt_secret(endpoint_id, new_secret)
    endpoint.updated_at = utcnow()
    await audit(
        db,
        actor,
        "webhook_endpoint.secret_rotated",
        "webhook_endpoint",
        endpoint_id,
        {"urgent": urgent},
    )
    return endpoint, new_secret


async def archive_endpoint(
    db: AsyncSession,
    endpoint_id: uuid.UUID,
    actor: Actor,
) -> WebhookEndpoint:
    """Archive l'endpoint (désactivation définitive)."""
    endpoint = await _get_or_404(db, endpoint_id)
    if endpoint.status == "archived":
        return endpoint
    endpoint.status = "archived"
    endpoint.updated_at = utcnow()
    await audit(db, actor, "webhook_endpoint.archived", "webhook_endpoint", endpoint_id, {})
    return endpoint


# ---------------------------------------------------------------------------
# Deliveries
# ---------------------------------------------------------------------------


@dataclass
class DeliveryPage:
    items: list[WebhookDelivery]
    total: int
    page: int
    page_size: int

    @property
    def pages(self) -> int:
        return max(1, (self.total + self.page_size - 1) // self.page_size)


async def list_deliveries(
    db: AsyncSession,
    *,
    endpoint_id: uuid.UUID | None = None,
    status: str | None = None,
    event_type: str | None = None,
    page: int = 1,
) -> DeliveryPage:
    base = select(WebhookDelivery).order_by(WebhookDelivery.created_at.desc())
    if endpoint_id is not None:
        base = base.where(WebhookDelivery.endpoint_id == endpoint_id)
    if status:
        base = base.where(WebhookDelivery.status == status)
    if event_type:
        base = base.where(WebhookDelivery.event_type == event_type)

    total = (await db.scalar(select(func.count()).select_from(base.subquery()))) or 0
    items = list(
        (await db.scalars(base.offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE))).all()
    )
    return DeliveryPage(items=items, total=total, page=page, page_size=PAGE_SIZE)


async def retry_delivery(
    db: AsyncSession,
    delivery_id: str,
    actor: Actor,
) -> WebhookDelivery:
    """Replanifie immédiatement un envoi échoué ou abandonné."""
    delivery = await db.get(WebhookDelivery, delivery_id)
    if delivery is None:
        raise ApiProblem(404, "not_found", "Envoi introuvable.")
    if delivery.status not in {"failed", "abandoned"}:
        raise BusinessRule("not_retryable", "Seuls les envois échoués ou abandonnés peuvent être relancés.")

    delivery.status = "pending"
    delivery.next_attempt_at = utcnow()
    delivery.trigger = "manual"
    await audit(db, actor, "webhook_delivery.retried", "webhook_delivery", delivery_id, {})
    return delivery


async def abandon_delivery(
    db: AsyncSession,
    delivery_id: str,
    actor: Actor,
) -> WebhookDelivery:
    """Abandonne un envoi en attente ou échoué."""
    delivery = await db.get(WebhookDelivery, delivery_id)
    if delivery is None:
        raise ApiProblem(404, "not_found", "Envoi introuvable.")
    if delivery.status not in {"pending", "failed"}:
        raise BusinessRule("not_abandonable", "Seul un envoi en attente ou échoué peut être abandonné.")

    delivery.status = "abandoned"
    await audit(db, actor, "webhook_delivery.abandoned", "webhook_delivery", delivery_id, {})
    return delivery


async def bulk_retry_failed(
    db: AsyncSession,
    *,
    endpoint_id: uuid.UUID | None = None,
    actor: Actor,
) -> int:
    """Relance tous les envois échoués (ou seulement ceux d'un endpoint)."""
    stmt = select(WebhookDelivery).where(WebhookDelivery.status == "failed")
    if endpoint_id is not None:
        stmt = stmt.where(WebhookDelivery.endpoint_id == endpoint_id)
    deliveries = list((await db.scalars(stmt)).all())
    now = utcnow()
    for d in deliveries:
        d.status = "pending"
        d.next_attempt_at = now
        d.trigger = "manual"
    await audit(
        db,
        actor,
        "webhook_delivery.bulk_retried",
        "webhook_delivery",
        None,
        {
            "count": len(deliveries),
            "endpoint_id": str(endpoint_id) if endpoint_id else None,
        },
    )
    return len(deliveries)
