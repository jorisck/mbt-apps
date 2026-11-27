"""Tests d'authentification des passagers : inscription, vérification, connexion,
rotation des jetons, détection de réutilisation, annulation hors délai (lot L8, §18.3)."""

from __future__ import annotations

import uuid
from datetime import timedelta

import httpx
import pytest
from sqlalchemy import select, update

from app.db import session_scope
from app.domain.passengers import service as pax
from app.models import EmailOutbox, Passenger, PassengerRefreshToken, PassengerToken
from app.security import passwords
from app.timeutil import utcnow
from tests.conftest import API_HOST, PASSWORD, _client, demande_payload

# -------------------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------------------

API_HEADERS = {"X-Client-Key": "test-key-mbt"}


def _api() -> httpx.AsyncClient:
    return _client(API_HOST, API_HEADERS)


async def _register(
    email: str = "passenger@example.com",
    pw: str = PASSWORD,
) -> httpx.Response:
    async with _api() as c:
        return await c.post(
            "/v1/auth/register",
            json={
                "email": email,
                "password": pw,
                "first_name": "Marie",
                "last_name": "Dupont",
                "phone": "+32470123456",
                "language": "fr",
            },
        )


async def _get_verify_token(email: str = "passenger@example.com") -> str:
    """Récupère le jeton de vérification depuis la file d'e-mails."""
    async with session_scope() as db:
        passenger = await db.scalar(select(Passenger).where(Passenger.email == email))
        assert passenger is not None
        token_row = await db.scalar(
            select(PassengerToken)
            .where(
                PassengerToken.passenger_id == passenger.id,
                PassengerToken.purpose == "email_verify",
                PassengerToken.used_at.is_(None),
            )
        )
        assert token_row is not None
        # Le jeton brut n'est pas stocké ; on recherche dans les e-mails en file.
        mail = await db.scalar(
            select(EmailOutbox).where(
                EmailOutbox.to_address == email,
                EmailOutbox.template == "passenger_verify",
            )
        )
        assert mail is not None and mail.context is not None
        link: str = mail.context["link"]
        return link.split("token=")[1]


async def _register_and_verify(
    email: str = "passenger@example.com",
    pw: str = PASSWORD,
) -> None:
    """Inscrit et vérifie l'e-mail d'un passager."""
    await _register(email, pw)
    token = await _get_verify_token(email)
    async with _api() as c:
        resp = await c.post("/v1/auth/verify-email", json={"token": token})
        assert resp.status_code == 200, resp.text


async def _login(
    email: str = "passenger@example.com",
    pw: str = PASSWORD,
) -> dict:
    async with _api() as c:
        resp = await c.post(
            "/v1/auth/token",
            json={"email": email, "password": pw},
        )
        assert resp.status_code == 200, resp.text
        return resp.json()


# -------------------------------------------------------------------------------------
# 1. Inscription
# -------------------------------------------------------------------------------------

async def test_register_returns_201_and_enqueues_email() -> None:
    resp = await _register()
    assert resp.status_code == 201, resp.text
    async with session_scope() as db:
        mails = list(
            (
                await db.scalars(
                    select(EmailOutbox).where(EmailOutbox.template == "passenger_verify")
                )
            ).all()
        )
        assert len(mails) == 1


async def test_register_duplicate_email_still_returns_201_no_enumeration() -> None:
    """L'API ne révèle pas si l'e-mail est déjà enregistré."""
    resp1 = await _register()
    resp2 = await _register()  # même e-mail
    assert resp1.status_code == resp2.status_code == 201


async def test_register_weak_password_is_rejected() -> None:
    async with _api() as c:
        resp = await c.post(
            "/v1/auth/register",
            json={
                "email": "user@example.com",
                "password": "password1234",
                "first_name": "Jean",
                "last_name": "Blanc",
                "phone": "+32470123456",
                "language": "fr",
            },
        )
    assert resp.status_code == 422


# -------------------------------------------------------------------------------------
# 2. Vérification d'e-mail
# -------------------------------------------------------------------------------------

async def test_verify_email_activates_account() -> None:
    await _register()
    token = await _get_verify_token()
    async with _api() as c:
        resp = await c.post("/v1/auth/verify-email", json={"token": token})
    assert resp.status_code == 200
    async with session_scope() as db:
        p = await db.scalar(select(Passenger).where(Passenger.email == "passenger@example.com"))
        assert p is not None and p.status == "active" and p.email_verified_at is not None


async def test_verify_email_token_cannot_be_reused() -> None:
    await _register()
    token = await _get_verify_token()
    async with _api() as c:
        first = await c.post("/v1/auth/verify-email", json={"token": token})
        second = await c.post("/v1/auth/verify-email", json={"token": token})
    assert first.status_code == 200
    assert second.status_code == 422


async def test_expired_verify_token_is_rejected() -> None:
    await _register()
    async with session_scope() as db:
        await db.execute(update(PassengerToken).values(expires_at=utcnow() - timedelta(hours=1)))
    token = await _get_verify_token()
    async with _api() as c:
        resp = await c.post("/v1/auth/verify-email", json={"token": token})
    assert resp.status_code == 422


# -------------------------------------------------------------------------------------
# 3. Connexion
# -------------------------------------------------------------------------------------

async def test_login_requires_verified_email() -> None:
    await _register()  # statut pending, e-mail non vérifié
    async with _api() as c:
        resp = await c.post(
            "/v1/auth/token",
            json={"email": "passenger@example.com", "password": PASSWORD},
        )
    assert resp.status_code == 401


async def test_login_success_returns_token_pair() -> None:
    await _register_and_verify()
    pair = await _login()
    assert "access_token" in pair and "refresh_token" in pair
    assert pair["token_type"] == "bearer"


async def test_login_bad_password_returns_401() -> None:
    await _register_and_verify()
    async with _api() as c:
        resp = await c.post(
            "/v1/auth/token",
            json={"email": "passenger@example.com", "password": "wrong-wrong-wrong-1"},
        )
    assert resp.status_code == 401


async def test_account_locks_after_five_bad_passwords() -> None:
    await _register_and_verify()
    async with _api() as c:
        for _ in range(5):
            await c.post(
                "/v1/auth/token",
                json={"email": "passenger@example.com", "password": "wrong-wrong-wrong-1"},
            )
        # Le bon mot de passe est aussi refusé après verrouillage.
        locked = await c.post(
            "/v1/auth/token",
            json={"email": "passenger@example.com", "password": PASSWORD},
        )
    assert locked.status_code == 401
    async with session_scope() as db:
        p = await db.scalar(select(Passenger).where(Passenger.email == "passenger@example.com"))
        assert p is not None and p.locked_until is not None


# -------------------------------------------------------------------------------------
# 4. Rotation du jeton de rafraîchissement
# -------------------------------------------------------------------------------------

async def test_refresh_returns_new_token_pair() -> None:
    await _register_and_verify()
    pair = await _login()
    async with _api() as c:
        resp = await c.post("/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    assert resp.status_code == 200
    new_pair = resp.json()
    # Le jeton de rafraîchissement doit changer (opaque, nouveau secret)
    assert new_pair["refresh_token"] != pair["refresh_token"]
    # Le jeton d'accès est un JWT avec iat = timestamp entier ; il peut être identique si
    # les deux appels sont dans la même seconde.  On vérifie juste qu'il est présent.
    assert new_pair["access_token"]


async def test_old_refresh_token_is_marked_used_after_rotation() -> None:
    await _register_and_verify()
    pair = await _login()
    async with _api() as c:
        await c.post("/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    async with session_scope() as db:
        import hashlib
        h = hashlib.sha256(pair["refresh_token"].encode()).digest()
        row = await db.scalar(select(PassengerRefreshToken).where(PassengerRefreshToken.token_hash == h))
        assert row is not None and row.used_at is not None


async def test_reuse_of_old_refresh_token_revokes_family() -> None:
    """Réutilisation d'un jeton déjà utilisé (hors délai de grâce) → révocation de toute la famille."""
    await _register_and_verify()
    pair = await _login()

    # Première rotation légitime
    async with _api() as c:
        r = await c.post("/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    assert r.status_code == 200

    # Simuler l'écoulement du délai de grâce (> 30 s)
    async with session_scope() as db:
        await db.execute(
            update(PassengerRefreshToken).values(used_at=utcnow() - timedelta(seconds=60))
        )

    # Réutilisation du jeton initial (volé)
    async with _api() as c:
        reuse = await c.post("/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    assert reuse.status_code == 401

    # Toute la famille doit être révoquée
    async with session_scope() as db:
        active = await db.scalar(
            select(PassengerRefreshToken).where(PassengerRefreshToken.revoked_at.is_(None))
        )
        assert active is None


async def test_grace_period_allows_reuse_within_30s() -> None:
    """Réutilisation dans les 30 s : tolérance réseau, on renvoie une nouvelle paire sans révoquer."""
    await _register_and_verify()
    pair = await _login()

    # Première rotation légitime
    async with _api() as c:
        r1 = await c.post("/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    assert r1.status_code == 200

    # used_at reste récent (< 30 s) → réutilisation tolérée
    async with _api() as c:
        r2 = await c.post("/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    assert r2.status_code == 200


async def test_expired_refresh_token_is_rejected() -> None:
    await _register_and_verify()
    pair = await _login()
    async with session_scope() as db:
        await db.execute(
            update(PassengerRefreshToken).values(expires_at=utcnow() - timedelta(seconds=1))
        )
    async with _api() as c:
        resp = await c.post("/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    assert resp.status_code == 401


# -------------------------------------------------------------------------------------
# 5. Profil /v1/me
# -------------------------------------------------------------------------------------

async def test_get_me_requires_auth() -> None:
    async with _api() as c:
        resp = await c.get("/v1/me")
    assert resp.status_code == 401


async def test_get_me_returns_profile() -> None:
    await _register_and_verify()
    pair = await _login()
    async with _api() as c:
        resp = await c.get("/v1/me", headers={"Authorization": f"Bearer {pair['access_token']}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "passenger@example.com"
    assert data["email_verified"] is True


async def test_patch_me_updates_first_name() -> None:
    await _register_and_verify()
    pair = await _login()
    async with _api() as c:
        resp = await c.patch(
            "/v1/me",
            json={"first_name": "Marianne"},
            headers={"Authorization": f"Bearer {pair['access_token']}"},
        )
    assert resp.status_code == 200
    assert resp.json()["first_name"] == "Marianne"


async def test_delete_me_requires_correct_password() -> None:
    import json as _json

    await _register_and_verify()
    pair = await _login()
    hdrs = {
        "Authorization": f"Bearer {pair['access_token']}",
        "Content-Type": "application/json",
    }
    async with _api() as c:
        bad = await c.request(
            "DELETE",
            "/v1/me",
            content=_json.dumps({"password": "wrong-wrong-wrong-1"}),
            headers=hdrs,
        )
        assert bad.status_code == 422
        ok = await c.request(
            "DELETE",
            "/v1/me",
            content=_json.dumps({"password": PASSWORD}),
            headers=hdrs,
        )
        assert ok.status_code == 204
    async with session_scope() as db:
        p = await db.scalar(select(Passenger).where(Passenger.email.like("anonymized-%")))
        assert p is not None and p.status == "anonymized"


# -------------------------------------------------------------------------------------
# 6. Adresses favorites
# -------------------------------------------------------------------------------------

async def test_address_crud() -> None:
    await _register_and_verify()
    pair = await _login()
    hdrs = {"Authorization": f"Bearer {pair['access_token']}"}
    async with _api() as c:
        # Ajout
        add = await c.post(
            "/v1/me/addresses",
            json={"label": "Domicile", "address": {"formatted": "Rue de la Loi 16, 1000 Bruxelles"}},
            headers=hdrs,
        )
        assert add.status_code == 201
        addr_id = add.json()["id"]
        # Liste
        lst = await c.get("/v1/me/addresses", headers=hdrs)
        assert lst.status_code == 200 and len(lst.json()) == 1
        # Suppression
        rm = await c.delete(f"/v1/me/addresses/{addr_id}", headers=hdrs)
        assert rm.status_code == 204
        # Vide
        lst2 = await c.get("/v1/me/addresses", headers=hdrs)
        assert lst2.json() == []


# -------------------------------------------------------------------------------------
# 7. Annulation de demande et délai
# -------------------------------------------------------------------------------------

async def test_passenger_can_cancel_own_demande() -> None:
    await _register_and_verify()
    pair = await _login()
    hdrs = {"Authorization": f"Bearer {pair['access_token']}"}
    # Crée une demande attachée au passager via jeton Bearer
    async with _api() as c:
        demande_resp = await c.post(
            "/v1/demandes",
            json=demande_payload(),
            headers={
                **hdrs,
                "Idempotency-Key": str(uuid.uuid4()),
                "X-End-User-IP": "198.51.100.1",
            },
        )
        assert demande_resp.status_code == 201, demande_resp.text
        demande_id = demande_resp.json()["id"]
        # Annulation
        cancel = await c.post(
            f"/v1/me/demandes/{demande_id}/cancel",
            json={},
            headers=hdrs,
        )
        assert cancel.status_code == 200
        assert cancel.json()["status"] == "cancelled"


async def test_cancel_deadline_enforced() -> None:
    """Un passager ne peut pas annuler une demande confirmée après le délai."""
    await _register_and_verify()
    pair = await _login()
    hdrs = {"Authorization": f"Bearer {pair['access_token']}"}
    # On récupère le passager pour obtenir son ID
    async with session_scope() as db:
        p = await db.scalar(select(Passenger).where(Passenger.email == "passenger@example.com"))
        assert p is not None

    # Crée une demande et la confirme directement en base avec pickup_at dans le passé
    from datetime import UTC
    from app.models import Demande
    async with session_scope() as db:
        from app.domain.demandes.service import next_reference
        ref = await next_reference(db)
        d = Demande(
            reference=ref,
            status="confirmed",
            origin="site_mbt",
            service="pmr",
            language="fr",
            passenger_id=p.id,
            passenger_first_name="Marie",
            passenger_last_name="Dupont",
            passenger_phone="+32470123456",
            passenger_email="passenger@example.com",
            pickup_at=utcnow() - timedelta(hours=48),  # dans le passé → délai dépassé
            pickup_address={"formatted": "Rue de la Loi 16, 1000 Bruxelles"},
            dropoff_address={"formatted": "Avenue Louise 54, 1050 Ixelles"},
            idempotency_key=str(uuid.uuid4()),
        )
        db.add(d)
        await db.flush()
        demande_id = d.id

    async with _api() as c:
        cancel = await c.post(
            f"/v1/me/demandes/{demande_id}/cancel",
            json={},
            headers=hdrs,
        )
    assert cancel.status_code == 422
    assert cancel.json()["code"] == "cancellation_too_late"


# -------------------------------------------------------------------------------------
# 8. Répétition de demande (brouillon sans création)
# -------------------------------------------------------------------------------------

async def test_repeat_demande_returns_draft_without_creating() -> None:
    await _register_and_verify()
    pair = await _login()
    hdrs = {"Authorization": f"Bearer {pair['access_token']}"}
    async with _api() as c:
        demande_resp = await c.post(
            "/v1/demandes",
            json=demande_payload(),
            headers={
                **hdrs,
                "Idempotency-Key": str(uuid.uuid4()),
                "X-End-User-IP": "198.51.100.1",
            },
        )
        assert demande_resp.status_code == 201
        demande_id = demande_resp.json()["id"]
        repeat = await c.post(f"/v1/me/demandes/{demande_id}/repeat", json={}, headers=hdrs)
    assert repeat.status_code == 200
    body = repeat.json()
    assert "draft" in body and body["draft"]["pickup_at"] is None
    assert body["based_on"] == demande_id


# -------------------------------------------------------------------------------------
# 9. Mot de passe oublié / réinitialisé
# -------------------------------------------------------------------------------------

async def test_password_reset_flow() -> None:
    await _register_and_verify()
    async with _api() as c:
        # Demande identique pour e-mail connu et inconnu
        known = await c.post("/v1/auth/password/forgot", json={"email": "passenger@example.com"})
        unknown = await c.post("/v1/auth/password/forgot", json={"email": "ghost@example.com"})
        assert known.status_code == unknown.status_code == 200
        assert known.text == unknown.text

    async with session_scope() as db:
        mails = list(
            (
                await db.scalars(
                    select(EmailOutbox).where(EmailOutbox.template == "passenger_password_reset")
                )
            ).all()
        )
        assert len(mails) == 1
        link = mails[0].context["link"]
    token = link.split("token=")[1]

    new_pw = "brand-new-pass-phrase-77"
    async with _api() as c:
        reset = await c.post("/v1/auth/password/reset", json={"token": token, "password": new_pw})
        assert reset.status_code == 200
        # Ancien mot de passe refusé, nouveau accepté
        old_login = await c.post(
            "/v1/auth/token", json={"email": "passenger@example.com", "password": PASSWORD}
        )
        new_login = await c.post(
            "/v1/auth/token", json={"email": "passenger@example.com", "password": new_pw}
        )
    assert old_login.status_code == 401
    assert new_login.status_code == 200


# -------------------------------------------------------------------------------------
# 10. Jeton Bearer optionnel sur POST /v1/demandes
# -------------------------------------------------------------------------------------

async def test_demande_with_bearer_links_passenger_id() -> None:
    await _register_and_verify()
    pair = await _login()
    async with _api() as c:
        resp = await c.post(
            "/v1/demandes",
            json=demande_payload(),
            headers={
                "Authorization": f"Bearer {pair['access_token']}",
                "Idempotency-Key": str(uuid.uuid4()),
                "X-End-User-IP": "198.51.100.1",
            },
        )
    assert resp.status_code == 201
    async with session_scope() as db:
        from app.models import Demande
        p = await db.scalar(select(Passenger).where(Passenger.email == "passenger@example.com"))
        d = await db.scalar(select(Demande).where(Demande.passenger_id == p.id))
        assert d is not None


async def test_demande_without_bearer_still_works() -> None:
    async with _api() as c:
        resp = await c.post(
            "/v1/demandes",
            json=demande_payload(),
            headers={
                "Idempotency-Key": str(uuid.uuid4()),
                "X-End-User-IP": "198.51.100.1",
            },
        )
    assert resp.status_code == 201
