"""Authentification de l'espace de gestion : sessions, CSRF, réauthentification, verrouillage."""

from __future__ import annotations

import httpx
from fastapi.routing import APIRoute
from sqlalchemy import select

from app.admin.app import create_admin_app
from app.db import session_scope
from app.domain.actors import Actor
from app.domain.admins import service as admins
from app.models import Admin, AdminSession, EmailOutbox
from tests.conftest import PASSWORD, Session, do_step_up, login, make_admin, parse_csrf

PUBLIC_PATHS = {
    "/login",
    "/invitations/{token}",
    "/password/forgot",
    "/password/reset/{token}",
    "/robots.txt",
    "/favicon.ico",
}


def _walk(routes: list) -> list[APIRoute]:  # type: ignore[type-arg]
    found: list[APIRoute] = []
    for route in routes:
        if isinstance(route, APIRoute):
            found.append(route)
        elif hasattr(route, "original_router"):  # routeurs inclus (FastAPI ≥ 0.16x)
            found.extend(_walk(route.original_router.routes))
    return found


def protected_routes() -> list[tuple[str, str]]:
    app = create_admin_app()
    return [
        (method, route.path)
        for route in _walk(app.routes)
        if route.path not in PUBLIC_PATHS
        for method in sorted(route.methods - {"HEAD", "OPTIONS"})
    ]


async def test_every_protected_route_requires_a_session(anon: httpx.AsyncClient) -> None:
    routes = protected_routes()
    assert len(routes) > 15  # garde-fou : la liste n'est pas vide par accident
    import uuid

    sample = str(uuid.uuid4())
    for method, path in routes:
        url = (
            path.replace("{demande_id}", sample)
            .replace("{note_id}", sample)
            .replace("{admin_id}", sample)
            .replace("{session_id}", sample)
        )
        response = await anon.request(method, url)
        assert response.status_code == 401, f"{method} {path} -> {response.status_code}"
        assert "demande" not in response.text.lower() or "login" in response.text.lower()


async def test_htmx_request_without_session_gets_redirect_header(anon: httpx.AsyncClient) -> None:
    response = await anon.get("/fragments/dashboard", headers={"HX-Request": "true"})
    assert response.status_code == 401 and response.headers["hx-redirect"] == "/login"


async def test_login_success_sets_hardened_cookie() -> None:
    await make_admin()
    response = await login()
    assert response.status_code == 303 and response.headers["location"] == "/"
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=strict" in cookie and "path=/" in cookie
    assert "max-age" in cookie


async def test_login_errors_are_identical_for_unknown_and_wrong_password() -> None:
    await make_admin()
    wrong = await login(password="not-the-right-password-1")
    unknown = await login(email="nobody@example.com", password="not-the-right-password-1")
    assert wrong.status_code == unknown.status_code == 401
    assert admins.GENERIC_LOGIN_ERROR in wrong.text and admins.GENERIC_LOGIN_ERROR in unknown.text
    assert "set-cookie" not in wrong.headers


async def test_account_locks_after_five_failures_even_with_good_password() -> None:
    await make_admin()
    for _ in range(5):
        assert (await login(password="wrong-wrong-wrong-1")).status_code == 401
    locked = await login()  # le bon mot de passe est lui aussi refusé
    assert locked.status_code == 401 and "set-cookie" not in locked.headers
    async with session_scope() as db:
        admin = await db.scalar(select(Admin))
        assert admin is not None and admin.locked_until is not None


async def test_disabled_and_invited_accounts_cannot_login() -> None:
    await make_admin("off@example.com", status="disabled")
    await make_admin("new@example.com", status="invited")
    assert (await login("off@example.com")).status_code == 401
    assert (await login("new@example.com")).status_code == 401


async def test_logout_revokes_the_session(session: Session) -> None:
    assert (await session.client.post("/logout", headers=session.headers)).status_code == 303
    assert (await session.client.get("/")).status_code == 401
    async with session_scope() as db:
        row = await db.scalar(select(AdminSession))
        assert row is not None and row.revoked_at is not None


async def test_csrf_token_is_required_on_writes(session: Session) -> None:
    url = "/account/profile"
    missing = await session.client.post(url, data={"full_name": "Nouveau Nom"})
    wrong = await session.client.post(url, data={"full_name": "Nouveau Nom"}, headers={"X-CSRF-Token": "x"})
    assert missing.status_code == wrong.status_code == 403
    in_form = await session.client.post(url, data={"full_name": "Nouveau Nom", "csrf_token": session.csrf})
    assert in_form.status_code == 200


async def test_cross_origin_writes_are_refused(session: Session) -> None:
    evil = await session.client.post(
        "/account/profile",
        data={"full_name": "X Y"},
        headers={**session.headers, "Origin": "https://evil.example"},
    )
    assert evil.status_code == 403
    fetch_site = await session.client.post(
        "/account/profile",
        data={"full_name": "X Y"},
        headers={**session.headers, "Sec-Fetch-Site": "cross-site"},
    )
    assert fetch_site.status_code == 403


async def test_origin_null_from_no_referrer_forms_is_accepted_only_for_same_origin(session: Session) -> None:
    """`Referrer-Policy: no-referrer` fait envoyer `Origin: null` par les formulaires du site lui-même."""
    same_site = await session.client.post(
        "/account/profile",
        data={"full_name": "Nom Valide"},
        headers={**session.headers, "Origin": "null", "Sec-Fetch-Site": "same-origin"},
    )
    assert same_site.status_code == 200
    cross_site = await session.client.post(
        "/account/profile",
        data={"full_name": "X Y"},
        headers={**session.headers, "Origin": "null", "Sec-Fetch-Site": "cross-site"},
    )
    assert cross_site.status_code == 403
    unknown = await session.client.post(
        "/account/profile",
        data={"full_name": "X Y"},
        headers={**session.headers, "Origin": "null"},
    )
    assert unknown.status_code == 403


async def test_sensitive_actions_need_step_up_with_password(session: Session) -> None:
    body = {"email": "bob@example.com", "full_name": "Bob Janssens"}
    first = await session.htmx("POST", "/admins/invitations", data=body)
    assert first.status_code == 403 and first.json()["code"] == "step_up_required"

    bad = await session.client.post("/auth/step-up", data={"password": "nope-nope-nope-1"}, headers=session.headers)
    assert bad.status_code == 403
    still = await session.htmx("POST", "/admins/invitations", data=body)
    assert still.status_code == 403

    await do_step_up(session)
    ok = await session.htmx("POST", "/admins/invitations", data=body)
    assert ok.status_code == 200 and "Invitation envoyée" in ok.text
    async with session_scope() as db:
        templates = set((await db.scalars(select(EmailOutbox.template))).all())
        assert "admin_invitation" in templates


async def test_settings_and_exports_need_step_up(session: Session) -> None:
    assert (await session.htmx("POST", "/settings", data={})).status_code == 403
    assert (await session.client.get("/demandes/export.csv")).status_code == 403
    for target in ("disable", "enable", "revoke-sessions"):
        import uuid

        response = await session.htmx("POST", f"/admins/{uuid.uuid4()}/{target}")
        assert response.status_code == 403


async def test_step_up_expires(session: Session) -> None:
    from datetime import timedelta

    from sqlalchemy import update

    from app.timeutil import utcnow

    await do_step_up(session)
    assert (await session.client.get("/demandes/export.csv")).status_code == 200
    async with session_scope() as db:
        await db.execute(update(AdminSession).values(step_up_until=utcnow() - timedelta(seconds=1)))
    assert (await session.client.get("/demandes/export.csv")).status_code == 403


async def test_idle_session_expires(session: Session) -> None:
    from datetime import timedelta

    from sqlalchemy import update

    from app.timeutil import utcnow

    async with session_scope() as db:
        await db.execute(update(AdminSession).values(last_seen_at=utcnow() - timedelta(hours=3)))
    assert (await session.client.get("/")).status_code == 401


async def test_cannot_disable_last_active_admin_or_self(session: Session) -> None:
    await do_step_up(session)
    own = await session.htmx("POST", f"/admins/{session.admin.id}/disable")
    assert own.status_code == 422
    other = await make_admin("bob@example.com", "Bob")
    async with session_scope() as db:
        bob = await db.scalar(select(Admin).where(Admin.email == "bob@example.com"))
        assert bob is not None
    assert (await session.htmx("POST", f"/admins/{bob.id}/disable")).status_code == 200
    # Bob désactivé : il ne reste qu'Alice, qui ne peut de toute façon pas se désactiver.
    assert (await session.htmx("POST", f"/admins/{session.admin.id}/disable")).status_code == 422
    assert other.email == "bob@example.com"


async def test_disabling_an_admin_closes_their_sessions() -> None:
    await make_admin("alice@example.com", "Alice")
    await make_admin("bob@example.com", "Bob")
    bob_login = await login("bob@example.com")
    cookie = bob_login.headers["set-cookie"].split(";")[0]
    async with session_scope() as db:
        alice = await db.scalar(select(Admin).where(Admin.email == "alice@example.com"))
        bob = await db.scalar(select(Admin).where(Admin.email == "bob@example.com"))
        assert alice and bob
        await admins.set_admin_enabled(db, Actor.admin(alice.id), bob.id, False)
    from tests.conftest import ADMIN_HOST, _client

    async with _client(ADMIN_HOST) as client:
        client.headers["Cookie"] = cookie
        assert (await client.get("/")).status_code == 401


async def test_invitation_flow_end_to_end(anon: httpx.AsyncClient) -> None:
    async with session_scope() as db:
        admin, token = await admins.invite_admin(db, Actor.system(), "carol@example.com", "Carol Peeters")
    page = await anon.get(f"/invitations/{token}")
    assert page.status_code == 200 and "Carol Peeters" in page.text
    mismatch = await anon.post(f"/invitations/{token}", data={"password": PASSWORD, "confirm": "different-password-9"})
    assert mismatch.status_code == 422
    weak = await anon.post(f"/invitations/{token}", data={"password": "password1234", "confirm": "password1234"})
    assert weak.status_code == 422
    ok = await anon.post(f"/invitations/{token}", data={"password": PASSWORD, "confirm": PASSWORD})
    assert ok.status_code == 303
    assert (await anon.get(f"/invitations/{token}")).status_code == 404  # usage unique
    assert (await login("carol@example.com")).status_code == 303


async def test_password_reset_flow_and_no_user_enumeration(anon: httpx.AsyncClient) -> None:
    await make_admin()
    unknown = await anon.post("/password/forgot", data={"email": "ghost@example.com"})
    known = await anon.post("/password/forgot", data={"email": "alice@example.com"})
    assert unknown.status_code == known.status_code == 200
    assert unknown.text == known.text
    async with session_scope() as db:
        mails = list(
            (await db.scalars(select(EmailOutbox).where(EmailOutbox.template == "admin_password_reset"))).all()
        )
        assert len(mails) == 1
        link = mails[0].context["link"]
    token = link.rsplit("/", 1)[1]
    new_password = "another-strong-passphrase-42"
    done = await anon.post(f"/password/reset/{token}", data={"password": new_password, "confirm": new_password})
    assert done.status_code == 303
    assert (await login(password=PASSWORD)).status_code == 401
    assert (await login(password=new_password)).status_code == 303
    assert (await anon.get(f"/password/reset/{token}")).status_code == 404


async def test_password_change_closes_other_sessions(session: Session) -> None:
    from tests.conftest import ADMIN_HOST, _client

    other = await login()
    other_cookie = other.headers["set-cookie"].split(";")[0]
    new = "brand-new-passphrase-77"
    response = await session.client.post(
        "/account/password",
        data={"current": PASSWORD, "new": new, "confirm": new},
        headers=session.headers,
    )
    assert response.status_code == 200 and "Mot de passe modifié" in response.text
    async with _client(ADMIN_HOST) as client:
        client.headers["Cookie"] = other_cookie
        assert (await client.get("/")).status_code == 401
    assert (await session.client.get("/")).status_code == 200  # la session courante reste ouverte
    assert parse_csrf((await session.client.get("/account")).text)
