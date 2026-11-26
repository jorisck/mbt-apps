"""Fixtures : base PostgreSQL de test `mbt_test` (recréée au début de la session), clients ASGI."""

from __future__ import annotations

import asyncio
import re
import uuid
from collections.abc import AsyncIterator

import httpx
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text

from app.config import API_ROOT, settings
from app.db import create_engine, session_scope, set_engine
from app.domain.settings.service import clear_cache
from app.models import Admin
from app.security import passwords
from app.timeutil import utcnow

# --- Configuration forcée pour les tests -------------------------------------------------
settings.app_env = "development"
settings.session_cookie_secure = False
settings.resend_api_key = ""
settings.google_maps_api_key = ""
settings.admin_notify_emails = "equipe@example.com"
settings.__dict__["bff_key_map"] = {"test-key-mbt": "site_mbt", "test-key-handycab": "site_handycab"}

from app.main import app  # noqa: E402  (après la configuration)

PASSWORD = "correct-horse-battery-staple-9"
ADMIN_HOST = f"http://{settings.admin_host}"
API_HOST = f"http://{settings.public_api_host}"


@pytest.fixture(scope="session", autouse=True)
async def _database() -> AsyncIterator[None]:
    url = settings.test_database_url
    assert url.rstrip("/").endswith("_test"), "TEST_DATABASE_URL doit pointer vers une base *_test"
    engine = create_engine(url)
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_ROOT / "migrations"))
    cfg.set_main_option("sqlalchemy.url", url)
    await asyncio.to_thread(command.upgrade, cfg, "head")
    set_engine(engine)
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
async def _clean_tables() -> None:
    async with session_scope() as db:
        await db.execute(
            text(
                "DO $$ DECLARE t text; BEGIN "
                "SELECT string_agg(quote_ident(tablename), ',') INTO t FROM pg_tables "
                "WHERE schemaname = 'public' AND tablename <> 'alembic_version'; "
                "EXECUTE 'TRUNCATE ' || t || ' RESTART IDENTITY CASCADE'; END $$"
            )
        )
    clear_cache()


def _client(base_url: str, headers: dict[str, str] | None = None) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url=base_url,
        headers=headers or {},
        follow_redirects=False,
    )


@pytest.fixture
async def api() -> AsyncIterator[httpx.AsyncClient]:
    async with _client(API_HOST, {"X-Client-Key": "test-key-mbt"}) as client:
        yield client


@pytest.fixture
async def anon() -> AsyncIterator[httpx.AsyncClient]:
    """Client de l'espace de gestion, sans session."""
    async with _client(ADMIN_HOST) as client:
        yield client


async def make_admin(email: str = "alice@example.com", name: str = "Alice Martin", status: str = "active") -> Admin:
    async with session_scope() as db:
        admin = Admin(
            email=email,
            full_name=name,
            status=status,
            password_hash=passwords.hash_password(PASSWORD),
            password_changed_at=utcnow(),
        )
        db.add(admin)
    return admin


class Session:
    """Client connecté + jeton CSRF."""

    def __init__(self, client: httpx.AsyncClient, csrf: str, admin: Admin) -> None:
        self.client, self.csrf, self.admin = client, csrf, admin

    @property
    def headers(self) -> dict[str, str]:
        return {"X-CSRF-Token": self.csrf}

    async def htmx(self, method: str, url: str, **kwargs: object) -> httpx.Response:
        headers = {**self.headers, "HX-Request": "true", **(kwargs.pop("headers", {}) or {})}  # type: ignore[arg-type]
        return await self.client.request(method, url, headers=headers, **kwargs)  # type: ignore[arg-type]


def parse_csrf(html: str) -> str:
    match = re.search(r'<meta name="csrf-token" content="([^"]+)"', html)
    assert match, "jeton CSRF absent de la page"
    return match.group(1)


async def login(email: str = "alice@example.com", password: str = PASSWORD) -> httpx.Response:
    async with _client(ADMIN_HOST) as client:
        return await client.post("/login", data={"email": email, "password": password})


@pytest.fixture
async def session() -> AsyncIterator[Session]:
    admin = await make_admin()
    async with _client(ADMIN_HOST) as client:
        response = await client.post("/login", data={"email": admin.email, "password": PASSWORD})
        assert response.status_code == 303, response.text
        cookie = response.headers["set-cookie"].split(";")[0]
        client.headers["Cookie"] = cookie
        page = await client.get("/")
        assert page.status_code == 200
        yield Session(client, parse_csrf(page.text), admin)


async def do_step_up(s: Session) -> None:
    response = await s.client.post("/auth/step-up", data={"password": PASSWORD}, headers=s.headers)
    assert response.status_code == 200, response.text


def demande_payload(**overrides: object) -> dict[str, object]:
    from datetime import timedelta

    from app.timeutil import to_brussels

    when = (to_brussels(utcnow()) + timedelta(days=3)).strftime("%Y-%m-%dT10:00")
    unique = uuid.uuid4().hex[:8]
    payload: dict[str, object] = {
        "service": "pmr",
        "pickup_at": when,
        "pickup": {"formatted": "Rue de la Loi 16, 1000 Bruxelles"},
        "dropoff": {"formatted": "Avenue Louise 54, 1050 Ixelles"},
        "passenger_count": 1,
        "passenger": {
            "first_name": "Marie",
            "last_name": "Dupont",
            "phone": "0470 12 34 56",
            "email": f"marie.{unique}@example.com",
            "language": "fr",
        },
        "privacy_consent": True,
        "antispam": {"hp": "", "elapsed_ms": 8000},
    }
    payload.update(overrides)
    return payload


async def create_demande(api: httpx.AsyncClient, **overrides: object) -> dict[str, str]:
    response = await api.post(
        "/v1/demandes",
        json=demande_payload(**overrides),
        headers={"Idempotency-Key": str(uuid.uuid4()), "X-End-User-IP": f"198.51.100.{uuid.uuid4().int % 250 + 1}"},
    )
    assert response.status_code == 201, response.text
    return response.json()
