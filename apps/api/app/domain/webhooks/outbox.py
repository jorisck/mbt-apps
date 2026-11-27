"""Outbox webhooks (§8.4, §8.5, §8.6).

Mise en file :
  `enqueue_webhook_event` est appelée DANS la transaction qui modifie la demande.
  Un `WebhookDelivery` est créé pour chaque endpoint actif abonné à l'événement.

Calendrier des tentatives (§8.6) :
  Tentative 1 : immédiate
  Tentative 2 : +1 min     (cumulé : 1 min)
  Tentative 3 : +5 min     (cumulé : 6 min)
  Tentative 4 : +30 min    (cumulé : 36 min)
  Tentative 5 : +2 h       (cumulé : 2 h 36)
  Tentative 6 : +6 h       (cumulé : 8 h 36)
  Tentative 7 : +12 h      (cumulé : 20 h 36)
  Après la 7e : failed.
  Chaque délai varie de ±10 % (gigue).

Worker (§8.5) :
  `claim_due`     → réserve des envois (FOR UPDATE SKIP LOCKED), pose un bail de 60 s.
  `record_attempt`→ enregistre la tentative et calcule la prochaine échéance.
  `reclaim_expired_leases` → remet en `pending` les envois dont le bail a expiré.
"""

from __future__ import annotations

import json
import random
import time
import uuid
from datetime import timedelta
from typing import Any

import structlog
from sqlalchemy import any_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.webhooks.payload import build_payload
from app.domain.webhooks.sender import AttemptResult
from app.domain.webhooks.signing import decode_secret, signature_header
from app.models import Demande, WebhookAttempt, WebhookDelivery, WebhookEndpoint
from app.security.crypto import get_keyring
from app.timeutil import utcnow

log = structlog.get_logger("webhooks")

# Délais entre tentatives (en secondes), sans gigue.
_BACKOFF_SECONDS = [0, 60, 300, 1800, 7200, 21600, 43200]
MAX_ATTEMPTS = len(_BACKOFF_SECONDS)  # 7
LEASE = timedelta(seconds=60)
_JITTER = 0.10  # ±10 %

CLAIM_SQL = text("""
    UPDATE webhook_deliveries d
    SET status = 'sending', lease_until = now() + interval '60 seconds'
    WHERE d.id IN (
        SELECT wd.id
        FROM webhook_deliveries wd
        JOIN webhook_endpoints e ON e.id = wd.endpoint_id AND e.status = 'active'
        WHERE wd.status = 'pending' AND wd.next_attempt_at <= now()
        ORDER BY wd.next_attempt_at
        LIMIT :limit
        FOR UPDATE OF wd SKIP LOCKED
    )
    RETURNING d.id, d.endpoint_id
""")


def _new_delivery_id() -> str:
    return "msg_" + uuid.uuid7().hex


def _secret_aad(endpoint_id: uuid.UUID, *, prev: bool = False) -> bytes:
    suffix = ":secret_prev" if prev else ":secret"
    return f"webhook_endpoint:{endpoint_id}{suffix}".encode()


def _headers_aad(endpoint_id: uuid.UUID) -> bytes:
    return f"webhook_endpoint:{endpoint_id}:headers".encode()


def _decrypt_secret(endpoint: WebhookEndpoint) -> str:
    kr = get_keyring()
    return kr.decrypt(endpoint.secret_enc, _secret_aad(endpoint.id)).decode()


def _signing_keys(endpoint: WebhookEndpoint) -> list[bytes]:
    """Retourne les clés de signature actives (courante + éventuellement ancienne)."""
    keys = [decode_secret(_decrypt_secret(endpoint))]
    if (
        endpoint.secret_prev_enc is not None
        and endpoint.secret_prev_expires_at is not None
        and endpoint.secret_prev_expires_at > utcnow()
    ):
        kr = get_keyring()
        prev_secret = kr.decrypt(
            endpoint.secret_prev_enc, _secret_aad(endpoint.id, prev=True)
        ).decode()
        keys.append(decode_secret(prev_secret))
    return keys


def _decrypt_custom_headers(endpoint: WebhookEndpoint) -> dict[str, str]:
    if endpoint.custom_headers_enc is None:
        return {}
    kr = get_keyring()
    raw = kr.decrypt(endpoint.custom_headers_enc, _headers_aad(endpoint.id))
    data: Any = json.loads(raw)
    if isinstance(data, dict):
        return {str(k): str(v) for k, v in data.items()}
    return {}


def _next_attempt_at(attempt_count: int) -> Any:
    """Calcule `next_attempt_at` après `attempt_count` tentatives (index 0 = première)."""
    if attempt_count >= MAX_ATTEMPTS:
        return None  # sera ignoré : statut passera à failed
    idx = min(attempt_count, len(_BACKOFF_SECONDS) - 1)
    delay = _BACKOFF_SECONDS[idx]
    jitter = delay * _JITTER * (2 * random.random() - 1)  # noqa: S311 (non-crypto)
    actual = max(0.0, delay + jitter)
    return utcnow() + timedelta(seconds=actual)


# ---------------------------------------------------------------------------
# Mise en file (appelée DANS la transaction de la demande)
# ---------------------------------------------------------------------------


async def enqueue_webhook_event(
    db: AsyncSession,
    demande: Demande,
    event_type: str,
    *,
    timestamp: Any = None,
) -> int:
    """Crée un `WebhookDelivery` pour chaque endpoint actif abonné.

    DOIT être appelée DANS la transaction qui modifie la demande.
    Ne fait aucun commit.
    Retourne le nombre d'envois créés.
    """
    result = await db.scalars(
        select(WebhookEndpoint).where(
            WebhookEndpoint.status == "active",
            any_(WebhookEndpoint.events) == event_type,
        )
    )
    endpoints = result.all()
    count = 0
    for endpoint in endpoints:
        payload = build_payload(
            event_type,
            demande,
            include_health=endpoint.include_health_data,
            timestamp=timestamp,
        )
        delivery = WebhookDelivery(
            id=_new_delivery_id(),
            endpoint_id=endpoint.id,
            demande_id=demande.id,
            event_type=event_type,
            payload=payload,
        )
        db.add(delivery)
        count += 1
    return count


# ---------------------------------------------------------------------------
# Worker : réclamer, enregistrer, récupérer les baux expirés
# ---------------------------------------------------------------------------


async def claim_due(db: AsyncSession, limit: int = 20) -> list[tuple[str, uuid.UUID]]:
    """Réserve des envois dus (SKIP LOCKED) et pose un bail de 60 s.

    Retourne la liste de (delivery_id, endpoint_id).
    """
    rows = (await db.execute(CLAIM_SQL, {"limit": limit})).all()
    return [(row[0], row[1]) for row in rows]


async def reclaim_expired_leases(db: AsyncSession) -> int:
    """Remet en `pending` les envois dont le bail a expiré (reprise après plantage)."""
    result = await db.execute(
        update(WebhookDelivery)
        .where(
            WebhookDelivery.status == "sending",
            WebhookDelivery.lease_until < utcnow(),
        )
        .values(status="pending", lease_until=None)
    )
    return result.rowcount or 0


async def record_attempt(
    db: AsyncSession,
    delivery_id: str,
    result: AttemptResult,
    *,
    trigger: str = "auto",
    triggered_by: uuid.UUID | None = None,
) -> None:
    """Enregistre la tentative et met à jour le statut / la prochaine échéance."""
    delivery = await db.get(WebhookDelivery, delivery_id)
    if delivery is None:
        log.error("webhooks.record_attempt.not_found", delivery_id=delivery_id)
        return

    delivery.attempt_count += 1
    delivery.lease_until = None

    attempt = WebhookAttempt(
        delivery_id=delivery_id,
        trigger=trigger,
        triggered_by=triggered_by,
        resolved_ip=result.resolved_ip,
        http_status=result.http_status,
        error_type=result.error_type,
        response_excerpt=result.response_excerpt,
        duration_ms=result.duration_ms,
    )
    db.add(attempt)

    if result.success:
        delivery.status = "succeeded"
        if result.external_id:
            delivery.external_id = result.external_id
        log.info(
            "webhooks.delivered",
            delivery_id=delivery_id,
            http_status=result.http_status,
            duration_ms=result.duration_ms,
        )
    elif delivery.attempt_count >= MAX_ATTEMPTS:
        delivery.status = "failed"
        delivery.last_error = result.error_type
        log.warning(
            "webhooks.failed",
            delivery_id=delivery_id,
            attempt_count=delivery.attempt_count,
            error_type=result.error_type,
        )
    else:
        delivery.status = "pending"
        delivery.last_error = result.error_type
        delivery.next_attempt_at = _next_attempt_at(delivery.attempt_count)
        log.info(
            "webhooks.retrying",
            delivery_id=delivery_id,
            attempt_count=delivery.attempt_count,
            next=str(delivery.next_attempt_at),
        )


# ---------------------------------------------------------------------------
# Construction des en-têtes de signature pour l'envoi
# ---------------------------------------------------------------------------


def build_send_headers(
    endpoint: WebhookEndpoint,
    delivery_id: str,
    body: bytes,
    *,
    timestamp: int | None = None,
) -> dict[str, str]:
    """Retourne tous les en-têtes nécessaires à l'envoi (signature incluse)."""
    ts = timestamp if timestamp is not None else int(time.time())
    keys = _signing_keys(endpoint)
    headers: dict[str, str] = {
        **_decrypt_custom_headers(endpoint),
        "webhook-id": delivery_id,
        "webhook-timestamp": str(ts),
        "webhook-signature": signature_header(keys, delivery_id, ts, body),
        "Content-Type": "application/json",
        "User-Agent": "HandyCab-Webhooks/1.0",
        "Accept-Encoding": "identity",
    }
    return headers
