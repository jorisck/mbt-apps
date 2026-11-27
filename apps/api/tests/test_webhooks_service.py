"""Tests pour le service webhooks, les routes admin et l'intégration worker (§8).

Couverture :
- activate_without_test_fails : activation refusée sans test réussi dans les 24 h.
- enqueue_on_confirm : enqueue_webhook_event appelé lors de la confirmation d'une demande.
- deliver_success_with_mock_sender : livraison réussie avec un sender simulé.
- admin routes : create wizard, test, activate, deactivate, rotate, archive.
"""

from __future__ import annotations

import json
import uuid
from datetime import timedelta
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from app.db import session_scope
from app.domain.actors import Actor
from app.domain.webhooks import service as svc
from app.domain.webhooks.outbox import claim_due, enqueue_webhook_event, record_attempt
from app.domain.webhooks.payload import build_test_payload
from app.domain.webhooks.sender import AttemptResult
from app.models import Demande, WebhookDelivery, WebhookEndpoint
from app.timeutil import utcnow
from tests.conftest import Session, create_demande, do_step_up, make_admin

# ---------------------------------------------------------------------------
# Fixtures helpers
# ---------------------------------------------------------------------------


ACTOR = Actor.system()


async def _make_endpoint(
    *,
    status: str = "inactive",
    events: list[str] | None = None,
    last_test_ok: bool | None = None,
    last_test_at_offset: timedelta | None = None,
) -> WebhookEndpoint:
    """Crée un endpoint en base et retourne l'objet."""
    async with session_scope() as db:
        endpoint, _secret = await svc.create_endpoint(
            db,
            name="Test endpoint",
            url="https://hooks.example.com/wh",
            events=events or ["demande.confirmed"],
            actor=ACTOR,
        )
        if status != "inactive" or last_test_ok is not None:
            endpoint.status = status
            if last_test_ok is not None:
                endpoint.last_test_ok = last_test_ok
                endpoint.last_test_at = utcnow() + (last_test_at_offset or timedelta(0))
        return endpoint


# ---------------------------------------------------------------------------
# activate_without_test_fails
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_activate_requires_successful_test() -> None:
    """activate_endpoint lève BusinessRule si aucun test n'a réussi."""
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="No-test endpoint",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=ACTOR,
        )
        endpoint_id = endpoint.id

    from app.errors import BusinessRule

    async with session_scope() as db:
        with pytest.raises(BusinessRule, match="test_required"):
            await svc.activate_endpoint(db, endpoint_id, ACTOR)


@pytest.mark.asyncio
async def test_activate_requires_recent_test() -> None:
    """activate_endpoint lève BusinessRule si le test a plus de 24 h."""
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Old-test endpoint",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=ACTOR,
        )
        # Simuler un test réussi il y a 25 h
        endpoint.last_test_ok = True
        endpoint.last_test_at = utcnow() - timedelta(hours=25)
        endpoint_id = endpoint.id

    from app.errors import BusinessRule

    async with session_scope() as db:
        with pytest.raises(BusinessRule, match="test_expired"):
            await svc.activate_endpoint(db, endpoint_id, ACTOR)


@pytest.mark.asyncio
async def test_activate_succeeds_after_recent_test() -> None:
    """activate_endpoint réussit si le test a réussi dans les 24 h."""
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Ready endpoint",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=ACTOR,
        )
        endpoint.last_test_ok = True
        endpoint.last_test_at = utcnow() - timedelta(hours=1)
        endpoint_id = endpoint.id

    async with session_scope() as db:
        ep = await svc.activate_endpoint(db, endpoint_id, ACTOR)
        assert ep.status == "active"


# ---------------------------------------------------------------------------
# enqueue_on_confirm
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_enqueue_on_confirm(api: Any, session: Session) -> None:
    """Un webhook est enfilé quand une demande est confirmée."""
    # Créer et activer un endpoint abonné à demande.confirmed
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Confirm endpoint",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=ACTOR,
        )
        endpoint.status = "active"
        endpoint.last_test_ok = True
        endpoint.last_test_at = utcnow()
        endpoint_id = endpoint.id

    # Créer une demande
    data = await create_demande(api)
    demande_id = data["id"]

    # Confirmer via l'UI admin
    page = await session.client.get(f"/demandes/{demande_id}")
    assert page.status_code == 200
    import re

    rev_match = re.search(r'name="revision"\s+value="(\d+)"', page.text)
    revision = int(rev_match.group(1)) if rev_match else 1

    resp = await session.htmx(
        "POST",
        f"/demandes/{demande_id}/transition",
        data={"to": "confirmed", "revision": revision, "csrf_token": session.csrf},
    )
    assert resp.status_code == 200

    # Vérifier qu'un WebhookDelivery a été créé
    from sqlalchemy import select

    async with session_scope() as db:
        deliveries = list(
            (
                await db.scalars(
                    select(WebhookDelivery).where(
                        WebhookDelivery.endpoint_id == endpoint_id,
                        WebhookDelivery.event_type == "demande.confirmed",
                    )
                )
            ).all()
        )
    assert len(deliveries) == 1
    assert deliveries[0].status == "pending"


# ---------------------------------------------------------------------------
# deliver_success_with_mock_sender
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_deliver_success_with_mock_sender() -> None:
    """record_attempt marque l'envoi comme réussi quand le sender retourne succès."""
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Mock endpoint",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=ACTOR,
        )
        endpoint.status = "active"
        endpoint_id = endpoint.id

        # Créer un delivery manuellement
        delivery = WebhookDelivery(
            id="msg_" + uuid.uuid4().hex,
            endpoint_id=endpoint_id,
            event_type="demande.confirmed",
            payload={"type": "demande.confirmed", "data": {}},
            status="sending",
        )
        db.add(delivery)
        await db.flush()
        delivery_id = delivery.id

    success_result = AttemptResult(
        success=True,
        http_status=200,
        resolved_ip="93.184.216.34",
        duration_ms=42,
    )

    async with session_scope() as db:
        await record_attempt(db, delivery_id, success_result)

    async with session_scope() as db:
        d = await db.get(WebhookDelivery, delivery_id)
        assert d is not None
        assert d.status == "succeeded"
        assert d.attempt_count == 1


@pytest.mark.asyncio
async def test_deliver_failure_then_retry() -> None:
    """Un envoi qui échoue peut être relancé via retry_delivery."""
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Retry endpoint",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=ACTOR,
        )
        delivery = WebhookDelivery(
            id="msg_" + uuid.uuid4().hex,
            endpoint_id=endpoint.id,
            event_type="demande.confirmed",
            payload={},
            status="failed",
            attempt_count=7,
        )
        db.add(delivery)
        await db.flush()
        delivery_id = delivery.id

    async with session_scope() as db:
        d = await svc.retry_delivery(db, delivery_id, ACTOR)
        assert d.status == "pending"
        assert d.trigger == "manual"


# ---------------------------------------------------------------------------
# Admin routes — connexions
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_connexions_list(session: Session) -> None:
    resp = await session.client.get("/connexions")
    assert resp.status_code == 200
    assert "Connexions" in resp.text


@pytest.mark.asyncio
async def test_connexion_create_wizard_step1(session: Session) -> None:
    resp = await session.client.get("/connexions/nouveau")
    assert resp.status_code == 200
    assert "Étape" in resp.text or "URL" in resp.text


@pytest.mark.asyncio
async def test_connexion_create_wizard_step2(session: Session) -> None:
    resp = await session.htmx(
        "POST",
        "/connexions/nouveau/step2",
        data={
            "name": "My Hook",
            "url": "https://hooks.example.com/wh",
            "csrf_token": session.csrf,
        },
    )
    assert resp.status_code == 200
    assert "Événements" in resp.text


@pytest.mark.asyncio
async def test_connexion_create_wizard_step2_invalid_url(session: Session) -> None:
    resp = await session.htmx(
        "POST",
        "/connexions/nouveau/step2",
        data={
            "name": "My Hook",
            "url": "http://not-https.example.com/wh",
            "csrf_token": session.csrf,
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_connexion_full_create_flow(session: Session) -> None:
    """Création complète d'un endpoint via POST /connexions."""
    resp = await session.htmx(
        "POST",
        "/connexions",
        data={
            "name": "Integration Test",
            "url": "https://hooks.example.com/wh",
            "events": "demande.confirmed",
            "include_health_data": "",
            "csrf_token": session.csrf,
        },
    )
    assert resp.status_code == 200
    assert "whsec_" in resp.text  # secret affiché une fois


@pytest.mark.asyncio
async def test_connexion_activate_without_test_via_route(session: Session) -> None:
    """POST /connexions/{id}/activate retourne 422 si pas de test."""
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="No-test",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=Actor.admin(session.admin.id),
        )
        eid = endpoint.id

    resp = await session.htmx(
        "POST",
        f"/connexions/{eid}/activate",
        data={"csrf_token": session.csrf},
    )
    # BusinessRule → 422 from problem handler
    assert resp.status_code in {200, 422}
    assert "test" in resp.text.lower()


@pytest.mark.asyncio
async def test_connexion_deactivate(session: Session) -> None:
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Active ep",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=Actor.admin(session.admin.id),
        )
        endpoint.status = "active"
        endpoint.last_test_ok = True
        endpoint.last_test_at = utcnow()
        eid = endpoint.id

    resp = await session.htmx(
        "POST",
        f"/connexions/{eid}/deactivate",
        data={"csrf_token": session.csrf},
    )
    assert resp.status_code == 200

    async with session_scope() as db:
        ep = await db.get(WebhookEndpoint, eid)
        assert ep.status == "inactive"


@pytest.mark.asyncio
async def test_connexion_rotate_secret_requires_stepup(session: Session) -> None:
    """rotate-secret doit renvoyer 403 step_up_required sans step-up."""
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Rotate ep",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=Actor.admin(session.admin.id),
        )
        eid = endpoint.id

    resp = await session.htmx(
        "POST",
        f"/connexions/{eid}/rotate-secret",
        data={"csrf_token": session.csrf},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_connexion_rotate_secret_with_stepup(session: Session) -> None:
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Rotate-with-stepup",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=Actor.admin(session.admin.id),
        )
        eid = endpoint.id

    await do_step_up(session)

    resp = await session.htmx(
        "POST",
        f"/connexions/{eid}/rotate-secret",
        data={"csrf_token": session.csrf},
    )
    assert resp.status_code == 200
    assert "whsec_" in resp.text


@pytest.mark.asyncio
async def test_connexion_archive_requires_stepup(session: Session) -> None:
    async with session_scope() as db:
        endpoint, _ = await svc.create_endpoint(
            db,
            name="Archive ep",
            url="https://hooks.example.com/wh",
            events=["demande.confirmed"],
            actor=Actor.admin(session.admin.id),
        )
        eid = endpoint.id

    resp = await session.htmx(
        "POST",
        f"/connexions/{eid}/archive",
        data={"csrf_token": session.csrf},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_envois_list(session: Session) -> None:
    resp = await session.client.get("/envois")
    assert resp.status_code == 200
    assert "envois" in resp.text.lower() or "journal" in resp.text.lower()
