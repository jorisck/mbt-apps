"""Construction du payload v1 (enveloppe Standard Webhooks + données demande).

Format :
  {
    "type": "demande.confirmed",
    "timestamp": "2026-11-26T10:15:02Z",
    "api_version": "2026-12-01",
    "data": { ...état complet de la demande... }
  }

Champs transmis : uniquement ce qui est utile au transport (§9.5).
Ne sont jamais transmis : passenger_id, assigned_admin_id, idempotency_key,
  request_fingerprint, search_text, notes internes, historique.

Les besoins de mobilité (données de santé) ne sont inclus que si
`include_health_data` est True pour la connexion (§9.5).
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.models import Demande
from app.timeutil import to_brussels

API_VERSION = "2026-12-01"


def _fmt_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _fmt_brussels_iso(dt: datetime | None) -> str | None:
    """Retourne la date avec son décalage horaire de Bruxelles (§6, champ pickup.at)."""
    if dt is None:
        return None
    local = to_brussels(dt)
    return local.isoformat()


def _address(addr: dict[str, Any] | None) -> dict[str, Any] | None:
    if addr is None:
        return None
    return {
        "formatted": addr.get("formatted"),
        "street": addr.get("street"),
        "number": addr.get("number"),
        "box": addr.get("box"),
        "postal_code": addr.get("postal_code"),
        "city": addr.get("city"),
        "country": addr.get("country", "BE"),
        "lat": addr.get("lat"),
        "lng": addr.get("lng"),
    }


def build_data(demande: Demande, *, include_health: bool = False) -> dict[str, Any]:
    """Construit l'objet `data` de l'enveloppe (état complet de la demande)."""
    data: dict[str, Any] = {
        "id": str(demande.id),
        "reference": demande.reference,
        "revision": demande.revision,
        "status": demande.status,
        "origin": demande.origin,
        "service": demande.service,
        "language": demande.language,
        "created_at": _fmt_iso(demande.created_at),
        "updated_at": _fmt_iso(demande.updated_at),
        "pickup": {
            "at": _fmt_brussels_iso(demande.pickup_at),
            "address": _address(demande.pickup_address),
            "instructions": demande.pickup_instructions,
        },
        "dropoff": {
            "address": _address(demande.dropoff_address),
        },
        "return": (
            {
                "at": _fmt_brussels_iso(demande.return_at),
                "pickup_address": _address(demande.return_pickup_address),
            }
            if demande.return_at
            else None
        ),
        "passenger_count": demande.passenger_count,
        "passenger": {
            "first_name": demande.passenger_first_name,
            "last_name": demande.passenger_last_name,
            "phone": demande.passenger_phone,
            "email": str(demande.passenger_email) if demande.passenger_email else None,
        },
        "needs": demande.needs if include_health else None,
        "comment": demande.comment,
        "refusal_reason": demande.refusal_reason,
        "cancellation": (
            {
                "by": demande.cancelled_by,
                "reason": demande.cancellation_reason,
                "at": _fmt_iso(demande.closed_at),
            }
            if demande.status == "cancelled"
            else None
        ),
    }
    return data


def build_payload(
    event_type: str,
    demande: Demande,
    *,
    include_health: bool = False,
    timestamp: datetime | None = None,
) -> dict[str, Any]:
    """Construit l'enveloppe complète (type + timestamp + api_version + data).

    `timestamp` est l'heure de l'événement (maintenant par défaut).
    Le payload est sérialisé une seule fois avant l'envoi et stocké tel quel.
    """
    from app.timeutil import utcnow

    ts = timestamp or utcnow()
    return {
        "type": event_type,
        "timestamp": _fmt_iso(ts),
        "api_version": API_VERSION,
        "data": build_data(demande, include_health=include_health),
    }


def build_test_payload(*, timestamp: datetime | None = None) -> dict[str, Any]:
    """Payload `webhook.test` (§8.7)."""
    from app.timeutil import utcnow

    ts = timestamp or utcnow()
    return {
        "type": "webhook.test",
        "timestamp": _fmt_iso(ts),
        "api_version": API_VERSION,
        "data": {"test": True},
    }
