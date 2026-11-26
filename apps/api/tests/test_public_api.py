"""POST /v1/demandes : contrat, idempotence, anti-spam, limites, e-mails en file."""

from __future__ import annotations

import uuid
from datetime import timedelta

import httpx
from sqlalchemy import func, select

from app.db import session_scope
from app.models import Demande, EmailOutbox
from app.timeutil import to_brussels, utcnow
from tests.conftest import create_demande, demande_payload


def headers(**extra: str) -> dict[str, str]:
    return {"Idempotency-Key": str(uuid.uuid4()), "X-End-User-IP": "203.0.113.7", **extra}


async def test_create_returns_reference_and_no_personal_data(api: httpx.AsyncClient) -> None:
    response = await api.post("/v1/demandes", json=demande_payload(), headers=headers())
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "reference", "status"}
    assert body["status"] == "received"
    assert body["reference"].startswith("T-")  # préfixe de test hors production


async def test_emails_are_queued_in_same_transaction(api: httpx.AsyncClient) -> None:
    await create_demande(api)
    async with session_scope() as db:
        templates = set((await db.scalars(select(EmailOutbox.template))).all())
    assert templates == {"demande_received", "demande_new"}


async def test_idempotent_replay_returns_same_demande(api: httpx.AsyncClient) -> None:
    key = str(uuid.uuid4())
    payload = demande_payload()
    first = await api.post("/v1/demandes", json=payload, headers=headers(**{"Idempotency-Key": key}))
    second = await api.post("/v1/demandes", json=payload, headers=headers(**{"Idempotency-Key": key}))
    assert first.status_code == 201 and second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    async with session_scope() as db:
        assert await db.scalar(select(func.count()).select_from(Demande)) == 1
        assert await db.scalar(select(func.count()).select_from(EmailOutbox)) == 2


async def test_same_key_other_content_is_refused(api: httpx.AsyncClient) -> None:
    key = str(uuid.uuid4())
    await api.post("/v1/demandes", json=demande_payload(), headers=headers(**{"Idempotency-Key": key}))
    other = await api.post(
        "/v1/demandes", json=demande_payload(service="vsl"), headers=headers(**{"Idempotency-Key": key})
    )
    assert other.status_code == 422
    assert other.json()["code"] == "idempotency_key_reused"


async def test_idempotency_key_is_mandatory(api: httpx.AsyncClient) -> None:
    response = await api.post("/v1/demandes", json=demande_payload())
    assert response.status_code == 422
    assert response.json()["code"] == "idempotency_key_required"


async def test_client_must_be_identified(api: httpx.AsyncClient) -> None:
    api.headers.pop("X-Client-Key")
    response = await api.post("/v1/demandes", json=demande_payload(), headers=headers())
    assert response.status_code == 401
    api.headers["X-Client-Key"] = "wrong"
    response = await api.post("/v1/demandes", json=demande_payload(), headers=headers())
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_client_key"


async def test_honeypot_and_too_fast_submissions_get_generic_refusal(api: httpx.AsyncClient) -> None:
    bot = await api.post(
        "/v1/demandes",
        json=demande_payload(antispam={"hp": "http://spam", "elapsed_ms": 9000}),
        headers=headers(),
    )
    fast = await api.post(
        "/v1/demandes",
        json=demande_payload(antispam={"hp": "", "elapsed_ms": 500}),
        headers=headers(),
    )
    for response in (bot, fast):
        assert response.status_code == 422
        assert response.json()["detail"] == "Requête refusée."


async def test_pickup_in_the_past_is_refused(api: httpx.AsyncClient) -> None:
    past = (to_brussels(utcnow()) - timedelta(days=1)).strftime("%Y-%m-%dT10:00")
    response = await api.post("/v1/demandes", json=demande_payload(pickup_at=past), headers=headers())
    assert response.status_code == 422
    assert response.json()["code"] == "pickup_too_soon"


async def test_nonexistent_local_time_is_refused(api: httpx.AsyncClient) -> None:
    # Passage à l'heure d'été : 02:30 n'existe pas. Prochain dernier dimanche de mars.
    year = to_brussels(utcnow()).year + 1
    day = max(d for d in range(25, 32) if _weekday(year, 3, d) == 6)
    response = await api.post(
        "/v1/demandes",
        json=demande_payload(pickup_at=f"{year}-03-{day}T02:30"),
        headers=headers(),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "nonexistent_local_time"


def _weekday(year: int, month: int, day: int) -> int:
    from datetime import date

    return date(year, month, day).weekday()


async def test_health_data_requires_explicit_consent(api: httpx.AsyncClient) -> None:
    needs = {"mobility_aid": "manual_wheelchair", "stays_in_wheelchair": True}
    refused = await api.post("/v1/demandes", json=demande_payload(needs=needs), headers=headers())
    assert refused.status_code == 422
    assert refused.json()["code"] == "health_consent_required"
    accepted = await api.post("/v1/demandes", json=demande_payload(needs=needs, health_consent=True), headers=headers())
    assert accepted.status_code == 201
    async with session_scope() as db:
        demande = await db.scalar(select(Demande))
        assert demande is not None and demande.health_consent_at is not None


async def test_unknown_fields_are_rejected(api: httpx.AsyncClient) -> None:
    response = await api.post("/v1/demandes", json=demande_payload(admin=True), headers=headers())
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"


async def test_rate_limit_per_ip(api: httpx.AsyncClient) -> None:
    statuses = []
    for _ in range(6):
        response = await api.post(
            "/v1/demandes", json=demande_payload(), headers=headers(**{"X-End-User-IP": "203.0.113.99"})
        )
        statuses.append(response.status_code)
    assert statuses == [201] * 5 + [429]


async def test_site_cannot_spoof_ip_without_valid_key(api: httpx.AsyncClient) -> None:
    """Une IP annoncée sans clé valide n'est jamais crue : la requête est simplement refusée."""
    api.headers.pop("X-Client-Key")
    response = await api.post("/v1/demandes", json=demande_payload(), headers=headers(**{"X-End-User-IP": "1.2.3.4"}))
    assert response.status_code == 401


async def test_config_endpoint_is_public_info_only(api: httpx.AsyncClient) -> None:
    response = await api.get("/v1/config")
    assert response.status_code == 200
    assert "notification_emails" not in response.text
