"""Routage par hôte, absence de CORS, en-têtes de sécurité, corps trop gros."""

from __future__ import annotations

import httpx

from tests.conftest import ADMIN_HOST, API_HOST, _client


async def test_unknown_host_is_404() -> None:
    async with _client("http://evil.example") as client:
        for path in ("/", "/login", "/v1/config", "/healthz"):
            assert (await client.get(path)).status_code == 404


async def test_admin_is_not_served_on_api_host(api: httpx.AsyncClient) -> None:
    for path in ("/login", "/demandes", "/static/admin.css"):
        assert (await api.get(path)).status_code == 404


async def test_public_api_is_not_served_on_admin_host(anon: httpx.AsyncClient) -> None:
    assert (await anon.get("/v1/config")).status_code == 404
    assert (await anon.get("/healthz")).status_code == 404


async def test_healthz_reveals_nothing(api: httpx.AsyncClient) -> None:
    response = await api.get("/healthz")
    assert response.status_code == 200 and response.text == "OK"


async def test_no_cors_headers(api: httpx.AsyncClient, anon: httpx.AsyncClient) -> None:
    for client, path in ((api, "/v1/config"), (anon, "/login")):
        response = await client.get(path, headers={"Origin": "https://evil.example"})
        assert "access-control-allow-origin" not in response.headers
    preflight = await api.options(
        "/v1/demandes",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in preflight.headers


async def test_admin_security_headers(anon: httpx.AsyncClient) -> None:
    response = await anon.get("/login")
    csp = response.headers["content-security-policy"]
    assert "script-src 'self'" in csp and "'unsafe-inline'" not in csp
    assert "frame-ancestors 'none'" in csp
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["cache-control"] == "no-store"
    assert "noindex" in response.headers["x-robots-tag"]


async def test_admin_pages_have_no_inline_script_or_style(anon: httpx.AsyncClient) -> None:
    html = (await anon.get("/login")).text
    assert "<script>" not in html and "style=" not in html and "onclick=" not in html


async def test_admin_is_never_indexed(anon: httpx.AsyncClient) -> None:
    """Trois couches : en-tête HTTP (même sur les erreurs et les fichiers), balise meta, robots.txt."""
    for path in ("/login", "/demandes", "/inexistant", "/static/admin.css", "/robots.txt", "/favicon.ico"):
        response = await anon.get(path)
        assert "noindex" in response.headers["x-robots-tag"], path
    html = (await anon.get("/login")).text
    assert '<meta name="robots" content="noindex, nofollow' in html
    assert '<meta name="googlebot" content="noindex, nofollow' in html
    assert (await anon.get("/robots.txt")).text == "User-agent: *\nDisallow: /\n"


async def test_login_shows_brand_links_and_favicon(anon: httpx.AsyncClient) -> None:
    from app.config import settings

    html = (await anon.get("/login")).text
    assert "img/logo-handycab.png" in html and "Espace de gestion" in html
    assert 'rel="icon"' in html and "img/favicon.ico" in html and 'rel="apple-touch-icon"' in html
    # Bouton « En savoir plus » et pied de page : les adresses viennent de la configuration.
    assert f'href="{settings.handycab_url}"' in html and "En savoir plus sur HandyCab" in html
    assert f'href="{settings.mbttaxis_url}"' in html and "Un service proposé par" in html
    assert html.count('rel="noopener noreferrer"') >= 2
    favicon = await anon.get("/favicon.ico")
    assert favicon.status_code == 200 and favicon.headers["content-type"] == "image/x-icon"
    assert (await anon.get("/static/img/logo-handycab.png")).status_code == 200


async def test_oversized_body_is_refused(api: httpx.AsyncClient) -> None:
    response = await api.post("/v1/demandes", content=b"x" * (70 * 1024), headers={"Content-Type": "application/json"})
    assert response.status_code == 413


async def test_api_errors_are_problem_json(api: httpx.AsyncClient) -> None:
    response = await api.post("/v1/demandes", json={})
    assert response.headers["content-type"].startswith("application/problem+json")
    assert (await api.get("/v1/unknown")).json()["code"] == "not_found"


def test_hosts_constants() -> None:
    assert ADMIN_HOST != API_HOST
