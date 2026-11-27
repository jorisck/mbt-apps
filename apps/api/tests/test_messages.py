"""POST /v1/messages : hors cycle de vie des demandes."""

from __future__ import annotations

import httpx
from sqlalchemy import func, select

from app.db import session_scope
from app.models import Demande, EmailOutbox


def payload(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "kind": "contact",
        "first_name": "Marie",
        "last_name": "Dupont",
        "email": "marie@example.com",
        "phone": "0470 12 34 56",
        "subject": "Question",
        "body": "Bonjour, j'aimerais des informations.",
        "privacy_consent": True,
        "antispam": {"hp": "", "elapsed_ms": 5000},
    }
    data.update(overrides)
    return data


async def test_message_queues_email_without_creating_demande(api: httpx.AsyncClient) -> None:
    response = await api.post(
        "/v1/messages", json=payload(), headers={"X-End-User-IP": "203.0.113.40"}
    )
    assert response.status_code == 201
    assert response.json() == {"ok": True}
    async with session_scope() as db:
        assert await db.scalar(select(func.count()).select_from(Demande)) == 0
        templates = list((await db.scalars(select(EmailOutbox.template))).all())
        assert templates == ["message_new"]


async def test_message_honeypot_and_consent(api: httpx.AsyncClient) -> None:
    bot = await api.post(
        "/v1/messages",
        json=payload(antispam={"hp": "x", "elapsed_ms": 9000}),
        headers={"X-End-User-IP": "203.0.113.41"},
    )
    assert bot.status_code == 422
    no_consent = await api.post(
        "/v1/messages",
        json=payload(privacy_consent=False),
        headers={"X-End-User-IP": "203.0.113.42"},
    )
    assert no_consent.status_code == 422


async def test_message_requires_site_key(api: httpx.AsyncClient) -> None:
    api.headers.pop("X-Client-Key")
    response = await api.post("/v1/messages", json=payload())
    assert response.status_code == 401
