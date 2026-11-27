"""Tests de l'espace de gestion : écran Passagers (§6.5).

Couverture ciblée :
- anonymize bloqué quand une demande received/confirmed à venir existe
- disable révoque tous les jetons de rafraîchissement actifs
- actions de base : list, detail, enable, resend-verification, export
"""

from __future__ import annotations

import secrets
import uuid
from datetime import timedelta

import pytest
from sqlalchemy import select, update

from app.db import session_scope
from app.domain.actors import Actor
from app.domain.passengers import admin_service as svc
from app.models import Demande, EmailOutbox, Passenger, PassengerRefreshToken
from app.security import passwords
from app.timeutil import utcnow
from tests.conftest import Session, do_step_up

# -------------------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------------------

_ACTOR = Actor("admin", uuid.uuid4(), "127.0.0.1")


async def _make_passenger(
    email: str = "passenger@example.com",
    status: str = "active",
    verified: bool = True,
) -> Passenger:
    async with session_scope() as db:
        p = Passenger(
            email=email,
            password_hash=passwords.hash_password("correct-horse-battery-staple-9"),
            first_name="Marie",
            last_name="Dupont",
            phone="+32470123456",
            language="fr",
            status=status,
            email_verified_at=utcnow() if verified else None,
        )
        db.add(p)
    return p


async def _add_refresh_token(passenger_id: uuid.UUID) -> PassengerRefreshToken:
    """Ajoute un jeton de rafraîchissement actif pour le passager."""
    async with session_scope() as db:
        t = PassengerRefreshToken(
            passenger_id=passenger_id,
            family_id=uuid.uuid4(),
            token_hash=b"x" * 32,
            client="app_ios",
            expires_at=utcnow() + timedelta(days=30),
        )
        db.add(t)
    return t


async def _create_demande_for_passenger(
    api,
    passenger_id: uuid.UUID,
    *,
    days_ahead: int = 3,
    status: str = "received",
) -> str:
    """Crée une demande et l'associe au passager (raccourci pour les tests)."""
    from datetime import timedelta
    from app.timeutil import to_brussels

    when = (to_brussels(utcnow()) + timedelta(days=days_ahead)).strftime("%Y-%m-%dT10:00")
    unique = uuid.uuid4().hex[:8]
    async with session_scope() as db:
        d = Demande(
            reference=f"TEST-{unique}",
            status=status,
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_id=passenger_id,
            passenger_first_name="Marie",
            passenger_last_name="Dupont",
            passenger_phone="+32470123456",
            passenger_email="passenger@example.com",
            pickup_at=utcnow() + timedelta(days=days_ahead),
            pickup_address={"formatted": "Rue de la Loi 16, 1000 Bruxelles"},
            dropoff_address={"formatted": "Avenue Louise 54, 1050 Ixelles"},
        )
        db.add(d)
    return d.reference


# -------------------------------------------------------------------------------------
# Tests : anonymize bloqué par demandes actives à venir
# -------------------------------------------------------------------------------------


async def test_anonymize_blocked_when_received_demande_ahead() -> None:
    """anonymize lève PassengerAdminError si une demande received à venir existe."""
    p = await _make_passenger()

    async with session_scope() as db:
        d = Demande(
            reference=f"TEST-{uuid.uuid4().hex[:8]}",
            status="received",
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_id=p.id,
            passenger_first_name=p.first_name,
            passenger_last_name=p.last_name,
            passenger_phone=p.phone,
            passenger_email=str(p.email),
            pickup_at=utcnow() + timedelta(days=2),
            pickup_address={"formatted": "Rue Test 1"},
            dropoff_address={"formatted": "Rue Test 2"},
        )
        db.add(d)

    async with session_scope() as db:
        with pytest.raises(svc.PassengerAdminError, match="demandes reçues ou confirmées"):
            await svc.anonymize(db, _ACTOR, p.id, "ANONYMISER")


async def test_anonymize_blocked_when_confirmed_demande_ahead() -> None:
    """anonymize lève PassengerAdminError si une demande confirmed à venir existe."""
    p = await _make_passenger(email="p2@example.com")

    async with session_scope() as db:
        d = Demande(
            reference=f"TEST-{uuid.uuid4().hex[:8]}",
            status="confirmed",
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_id=p.id,
            passenger_first_name=p.first_name,
            passenger_last_name=p.last_name,
            passenger_phone=p.phone,
            passenger_email=str(p.email),
            pickup_at=utcnow() + timedelta(days=1),
            pickup_address={"formatted": "Rue Test 1"},
            dropoff_address={"formatted": "Rue Test 2"},
        )
        db.add(d)

    async with session_scope() as db:
        with pytest.raises(svc.PassengerAdminError, match="demandes reçues ou confirmées"):
            await svc.anonymize(db, _ACTOR, p.id, "ANONYMISER")


async def test_anonymize_allowed_when_only_past_demande() -> None:
    """anonymize réussit si les demandes actives sont toutes dans le passé."""
    p = await _make_passenger(email="p3@example.com")

    async with session_scope() as db:
        d = Demande(
            reference=f"TEST-{uuid.uuid4().hex[:8]}",
            status="received",
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_id=p.id,
            passenger_first_name=p.first_name,
            passenger_last_name=p.last_name,
            passenger_phone=p.phone,
            passenger_email=str(p.email),
            pickup_at=utcnow() - timedelta(days=1),  # dans le passé
            pickup_address={"formatted": "Rue Test 1"},
            dropoff_address={"formatted": "Rue Test 2"},
        )
        db.add(d)

    async with session_scope() as db:
        await svc.anonymize(db, _ACTOR, p.id, "ANONYMISER")

    async with session_scope() as db:
        passenger = await db.get(Passenger, p.id)
        assert passenger is not None
        assert passenger.status == "anonymized"


async def test_anonymize_requires_confirm_word() -> None:
    """anonymize lève PassengerAdminError si le mot de confirmation est faux."""
    p = await _make_passenger(email="p4@example.com")

    async with session_scope() as db:
        with pytest.raises(svc.PassengerAdminError, match="ANONYMISER"):
            await svc.anonymize(db, _ACTOR, p.id, "MAUVAIS")


async def test_anonymize_anonymizes_demandes_pii() -> None:
    """anonymize efface le PII des demandes du passager."""
    p = await _make_passenger(email="p5@example.com")

    async with session_scope() as db:
        d = Demande(
            reference=f"TEST-{uuid.uuid4().hex[:8]}",
            status="completed",
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_id=p.id,
            passenger_first_name="Marie",
            passenger_last_name="Dupont",
            passenger_phone="+32470123456",
            passenger_email="p5@example.com",
            pickup_at=utcnow() - timedelta(days=5),
            pickup_address={"formatted": "Rue Test 1"},
            dropoff_address={"formatted": "Rue Test 2"},
        )
        db.add(d)
        await db.flush()  # génère l'ID avant de le capturer
        demande_id = d.id

    async with session_scope() as db:
        await svc.anonymize(db, _ACTOR, p.id, "ANONYMISER")

    async with session_scope() as db:
        demande = await db.scalar(select(Demande).where(Demande.id == demande_id))
        assert demande is not None
        assert demande.passenger_id is None
        assert demande.passenger_first_name == "Anonymisé"
        assert demande.passenger_last_name == ""
        assert demande.passenger_phone == ""
        assert demande.passenger_email is None


# -------------------------------------------------------------------------------------
# Tests : disable révoque les jetons
# -------------------------------------------------------------------------------------


async def test_disable_revokes_refresh_tokens() -> None:
    """set_enabled(enabled=False) révoque tous les jetons de rafraîchissement actifs."""
    p = await _make_passenger(email="p6@example.com")

    # Créer deux jetons actifs
    async with session_scope() as db:
        for _ in range(2):
            db.add(
                PassengerRefreshToken(
                    passenger_id=p.id,
                    family_id=uuid.uuid4(),
                    token_hash=secrets.token_bytes(32),
                    client="app_ios",
                    expires_at=utcnow() + timedelta(days=30),
                )
            )

    async with session_scope() as db:
        await svc.set_enabled(db, _ACTOR, p.id, enabled=False)

    async with session_scope() as db:
        active = list(
            (
                await db.scalars(
                    select(PassengerRefreshToken).where(
                        PassengerRefreshToken.passenger_id == p.id,
                        PassengerRefreshToken.revoked_at.is_(None),
                    )
                )
            ).all()
        )
        assert active == [], "Tous les jetons doivent être révoqués après désactivation"


async def test_disable_sets_status_disabled() -> None:
    p = await _make_passenger(email="p7@example.com")

    async with session_scope() as db:
        await svc.set_enabled(db, _ACTOR, p.id, enabled=False)

    async with session_scope() as db:
        passenger = await db.get(Passenger, p.id)
        assert passenger is not None
        assert passenger.status == "disabled"


async def test_enable_restores_status() -> None:
    p = await _make_passenger(email="p8@example.com", status="disabled")

    async with session_scope() as db:
        await svc.set_enabled(db, _ACTOR, p.id, enabled=True)

    async with session_scope() as db:
        passenger = await db.get(Passenger, p.id)
        assert passenger is not None
        assert passenger.status == "active"


async def test_disable_already_disabled_raises() -> None:
    p = await _make_passenger(email="p9@example.com", status="disabled")

    async with session_scope() as db:
        with pytest.raises(svc.PassengerAdminError, match="déjà désactivé"):
            await svc.set_enabled(db, _ACTOR, p.id, enabled=False)


# -------------------------------------------------------------------------------------
# Tests : routes HTTP
# -------------------------------------------------------------------------------------


async def test_list_passagers_renders(session: Session) -> None:
    await _make_passenger(email="http@example.com")
    page = await session.client.get("/passagers")
    assert page.status_code == 200
    assert "Passagers" in page.text
    assert "http@example.com" in page.text


async def test_list_passagers_search(session: Session) -> None:
    await _make_passenger(email="findme@example.com")
    await _make_passenger(email="other@example.com")

    page = await session.client.get("/passagers", params={"q": "findme"})
    assert page.status_code == 200
    assert "findme@example.com" in page.text
    assert "other@example.com" not in page.text


async def test_detail_passager_renders(session: Session) -> None:
    p = await _make_passenger(email="detail@example.com")
    page = await session.client.get(f"/passagers/{p.id}")
    assert page.status_code == 200
    assert "Marie" in page.text
    assert "detail@example.com" in page.text


async def test_detail_passager_not_found(session: Session) -> None:
    page = await session.client.get(f"/passagers/{uuid.uuid4()}")
    assert page.status_code == 404


async def test_disable_route(session: Session) -> None:
    p = await _make_passenger(email="disable@example.com")
    response = await session.htmx("POST", f"/passagers/{p.id}/disable")
    assert response.status_code == 200
    assert "désactivé" in response.text.lower()

    async with session_scope() as db:
        passenger = await db.get(Passenger, p.id)
        assert passenger is not None
        assert passenger.status == "disabled"


async def test_enable_route(session: Session) -> None:
    p = await _make_passenger(email="enable@example.com", status="disabled")
    response = await session.htmx("POST", f"/passagers/{p.id}/enable")
    assert response.status_code == 200
    assert "réactivé" in response.text.lower()

    async with session_scope() as db:
        passenger = await db.get(Passenger, p.id)
        assert passenger is not None
        assert passenger.status == "active"


async def test_export_requires_stepup(session: Session) -> None:
    p = await _make_passenger(email="export@example.com")
    response = await session.client.get(f"/passagers/{p.id}/export")
    # 403 step_up_required → JSON depuis problem_handler
    assert response.status_code == 403


async def test_export_json_with_stepup(session: Session) -> None:
    p = await _make_passenger(email="export2@example.com")
    await do_step_up(session)
    response = await session.client.get(f"/passagers/{p.id}/export")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    data = response.json()
    assert data["passenger"]["email"] == "export2@example.com"
    assert "addresses" in data
    assert "demandes" in data


async def test_anonymize_route_blocked_when_upcoming_confirmed(session: Session) -> None:
    """Route POST /passagers/{id}/anonymize bloquée si demande confirmed à venir."""
    p = await _make_passenger(email="anon-block@example.com")

    async with session_scope() as db:
        db.add(
            Demande(
                reference=f"TEST-{uuid.uuid4().hex[:8]}",
                status="confirmed",
                origin="site_mbt",
                service="pmr",
                language="fr",
                passenger_id=p.id,
                passenger_first_name="Marie",
                passenger_last_name="Dupont",
                passenger_phone="+32470123456",
                passenger_email="anon-block@example.com",
                pickup_at=utcnow() + timedelta(days=2),
                pickup_address={"formatted": "Rue Test 1"},
                dropoff_address={"formatted": "Rue Test 2"},
            )
        )

    await do_step_up(session)
    response = await session.htmx(
        "POST",
        f"/passagers/{p.id}/anonymize",
        data={"confirm": "ANONYMISER"},
    )
    assert response.status_code == 422
    assert "demandes" in response.text.lower()

    # Passager non anonymisé
    async with session_scope() as db:
        passenger = await db.get(Passenger, p.id)
        assert passenger is not None
        assert passenger.status != "anonymized"


async def test_anonymize_route_success(session: Session) -> None:
    """Route POST /passagers/{id}/anonymize réussit quand aucune demande active à venir."""
    p = await _make_passenger(email="anon-ok@example.com")
    await do_step_up(session)
    response = await session.htmx(
        "POST",
        f"/passagers/{p.id}/anonymize",
        data={"confirm": "ANONYMISER"},
    )
    assert response.status_code == 200
    assert "anonymisé" in response.text.lower()

    async with session_scope() as db:
        passenger = await db.get(Passenger, p.id)
        assert passenger is not None
        assert passenger.status == "anonymized"


async def test_anonymize_requires_stepup(session: Session) -> None:
    """POST anonymize sans step-up → 403."""
    p = await _make_passenger(email="anon-nsu@example.com")
    response = await session.htmx(
        "POST",
        f"/passagers/{p.id}/anonymize",
        data={"confirm": "ANONYMISER"},
    )
    assert response.status_code == 403


async def test_resend_verification_route(session: Session) -> None:
    p = await _make_passenger(email="resend@example.com", verified=False)
    response = await session.htmx("POST", f"/passagers/{p.id}/resend-verification")
    assert response.status_code == 200
    assert "vérification" in response.text.lower()

    async with session_scope() as db:
        mail = await db.scalar(
            select(EmailOutbox).where(
                EmailOutbox.to_address == "resend@example.com",
                EmailOutbox.template == "passenger_verify",
            )
        )
        assert mail is not None
