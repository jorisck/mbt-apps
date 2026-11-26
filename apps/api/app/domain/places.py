"""Validation d'adresse par Google Places (clé serveur, §18.7).

Un service externe ne bloque jamais une demande : en cas d'erreur, de délai dépassé ou de clé
absente, on conserve l'adresse saisie telle quelle (`verified = False`).
"""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from app.config import settings
from app.domain.demandes.schemas import AddressIn

log = structlog.get_logger("places")

DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"
FIELD_MASK = "formattedAddress,location,addressComponents"
TIMEOUT_S = 2.0
_COMPONENT_TYPES = {
    "street_number": "street_number",
    "route": "route",
    "postal_code": "postal_code",
    "locality": "locality",
}


def plain_address(address: AddressIn) -> dict[str, Any]:
    return {"formatted": address.formatted, "place_id": address.place_id, "verified": False}


async def resolve_address(
    address: AddressIn,
    session_token: str | None = None,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    result = plain_address(address)
    if not address.place_id or not settings.google_maps_api_key:
        return result

    params = {"sessionToken": session_token} if session_token else None
    headers = {
        "X-Goog-Api-Key": settings.google_maps_api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    owns_client = client is None
    client = client or httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT_S))
    try:
        response = await client.get(DETAILS_URL.format(place_id=address.place_id), params=params, headers=headers)
        if response.status_code != 200:
            log.warning("places.status", status=response.status_code)
            return result
        data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        log.warning("places.unavailable", error=type(exc).__name__)
        return result
    finally:
        if owns_client:
            await client.aclose()

    result["formatted"] = data.get("formattedAddress") or address.formatted
    location = data.get("location") or {}
    if "latitude" in location and "longitude" in location:
        result["lat"] = location["latitude"]
        result["lng"] = location["longitude"]
    components: dict[str, str] = {}
    for component in data.get("addressComponents", []):
        for kind in component.get("types", []):
            if kind in _COMPONENT_TYPES:
                components[_COMPONENT_TYPES[kind]] = component.get("longText", "")
    if components:
        result["components"] = components
    result["verified"] = True
    return result
