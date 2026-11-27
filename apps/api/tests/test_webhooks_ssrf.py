"""Tests unitaires : protection SSRF (ssrf.py) et validation d'URL (url_policy.py).

Pas de base de données nécessaire.
La résolution DNS est simulée via `ip_policy` injectable.
"""

from __future__ import annotations

import pytest

from app.domain.webhooks.ssrf import DeliveryError, is_public_ip, resolve_public_ips
from app.domain.webhooks.url_policy import InvalidURL, host_matches, validate_endpoint_url

# --- is_public_ip ------------------------------------------------------------------


@pytest.mark.parametrize(
    "addr,expected",
    [
        # Plages privées / réservées → False
        ("127.0.0.1", False),
        ("127.0.0.0", False),
        ("10.0.0.1", False),
        ("10.255.255.255", False),
        ("172.16.0.1", False),
        ("172.31.255.255", False),
        ("192.168.0.1", False),
        ("192.168.255.255", False),
        ("169.254.169.254", False),   # métadonnées cloud AWS/GCP/Azure
        ("100.64.0.1", False),         # CG-NAT
        ("0.0.0.0", False),
        ("224.0.0.1", False),          # multicast
        ("255.255.255.255", False),    # broadcast
        ("192.0.2.1", False),          # TEST-NET-1
        ("198.51.100.1", False),       # TEST-NET-2
        ("203.0.113.1", False),        # TEST-NET-3
        # IPv6 privées / réservées → False
        ("::1", False),
        ("fe80::1", False),
        ("fc00::1", False),
        ("fd00::1", False),
        ("::ffff:127.0.0.1", False),   # IPv4-mapped loopback
        ("::ffff:192.168.0.1", False), # IPv4-mapped privée
        ("64:ff9b::1.2.3.4", False),   # NAT64
        ("2002:7f00:1::1", False),     # 6to4 sur 127.0.0.1
        # Adresses publiques → True
        ("8.8.8.8", True),
        ("1.1.1.1", True),
        ("104.21.0.1", True),
        ("2606:4700::1", True),
    ],
)
def test_is_public_ip(addr: str, expected: bool) -> None:
    assert is_public_ip(addr) == expected, f"is_public_ip({addr!r}) should be {expected}"


# --- resolve_public_ips (avec ip_policy fictive) -----------------------------------


@pytest.mark.anyio
async def test_resolve_public_ips_all_public() -> None:
    """Si toutes les IP simulées sont publiques, retourne la liste."""
    async def fake_getaddrinfo(host, port, **kw):
        return [(None, None, None, None, ("1.2.3.4", port))]

    import app.domain.webhooks.ssrf as ssrf_mod
    orig = ssrf_mod.anyio.getaddrinfo
    ssrf_mod.anyio.getaddrinfo = fake_getaddrinfo  # type: ignore[attr-defined]
    try:
        ips = await resolve_public_ips("example.com", 443)
        assert ips == ["1.2.3.4"]
    finally:
        ssrf_mod.anyio.getaddrinfo = orig


@pytest.mark.anyio
async def test_resolve_public_ips_private_blocked() -> None:
    """Si une IP est privée, lève DeliveryError('ssrf_blocked')."""
    async def fake_getaddrinfo(host, port, **kw):
        return [(None, None, None, None, ("192.168.0.1", port))]

    import app.domain.webhooks.ssrf as ssrf_mod
    orig = ssrf_mod.anyio.getaddrinfo
    ssrf_mod.anyio.getaddrinfo = fake_getaddrinfo  # type: ignore[attr-defined]
    try:
        with pytest.raises(DeliveryError) as exc_info:
            await resolve_public_ips("internal.example.com", 443)
        assert exc_info.value.code == "ssrf_blocked"
    finally:
        ssrf_mod.anyio.getaddrinfo = orig


@pytest.mark.anyio
async def test_resolve_public_ips_via_policy() -> None:
    """ip_policy injectable : permet de tester sans toucher à anyio."""
    async def fake_getaddrinfo(host, port, **kw):
        return [(None, None, None, None, ("10.0.0.1", port))]

    import app.domain.webhooks.ssrf as ssrf_mod
    orig = ssrf_mod.anyio.getaddrinfo
    ssrf_mod.anyio.getaddrinfo = fake_getaddrinfo  # type: ignore[attr-defined]
    try:
        # Politique qui accepte tout : simule un réseau de test
        with pytest.raises(DeliveryError) as exc_info:
            await resolve_public_ips("test.example.com", 443, ip_policy=is_public_ip)
        assert exc_info.value.code == "ssrf_blocked"
    finally:
        ssrf_mod.anyio.getaddrinfo = orig


@pytest.mark.anyio
async def test_resolve_public_ips_dns_error() -> None:
    """Une erreur DNS doit lever DeliveryError('dns')."""
    async def fake_getaddrinfo(host, port, **kw):
        raise OSError("DNS resolution failed")

    import app.domain.webhooks.ssrf as ssrf_mod
    orig = ssrf_mod.anyio.getaddrinfo
    ssrf_mod.anyio.getaddrinfo = fake_getaddrinfo  # type: ignore[attr-defined]
    try:
        with pytest.raises(DeliveryError) as exc_info:
            await resolve_public_ips("nxdomain.example.com", 443)
        assert exc_info.value.code == "dns"
    finally:
        ssrf_mod.anyio.getaddrinfo = orig


# --- validate_endpoint_url ---------------------------------------------------------


@pytest.mark.parametrize(
    "url,expected_code",
    [
        ("http://example.com/hooks", "https_required"),
        ("https://user:pass@example.com/hooks", "credentials_in_url"),
        ("https://example.com/hooks#frag", "fragment_forbidden"),
        ("https://127.0.0.1/hooks", "hostname_required"),        # IP littérale
        ("https://192.168.0.1/hooks", "hostname_required"),
        ("https://localhost/hooks", "internal_hostname"),
        ("https://hooks.localhost/hooks", "internal_hostname"),
        ("https://hooks.local/hooks", "internal_hostname"),
        ("https://hooks.internal/hooks", "internal_hostname"),
        ("https://hooks.lan/hooks", "internal_hostname"),
        ("https://10.1/hooks", "numeric_host"),                  # IP déguisée
        ("https://example.com:8080/hooks", "port_forbidden"),    # port non autorisé
        ("https://" + "a" * 2050 + ".com/hooks", "too_long"),
    ],
)
def test_validate_endpoint_url_invalid(url: str, expected_code: str) -> None:
    with pytest.raises(InvalidURL) as exc_info:
        validate_endpoint_url(url)
    assert exc_info.value.url_code == expected_code, (
        f"URL {url!r} expected {expected_code!r}, got {exc_info.value.url_code!r}"
    )


@pytest.mark.parametrize(
    "url",
    [
        "https://hooks.example.com/handycab",
        "https://dispatch.taxi.example.be/webhooks",
        "https://example.com",
        "https://hooks.example.com:443/path",
    ],
)
def test_validate_endpoint_url_valid(url: str) -> None:
    normalized, host = validate_endpoint_url(url)
    assert normalized.startswith("https://")
    assert host  # nom d'hôte non vide


# --- host_matches ------------------------------------------------------------------


@pytest.mark.parametrize(
    "host,pattern,expected",
    [
        ("hooks.taxiger.com", "hooks.taxiger.com", True),
        ("HOOKS.TAXIGER.COM", "hooks.taxiger.com", True),     # insensible à la casse
        ("other.taxiger.com", "hooks.taxiger.com", False),
        ("hooks.taxiger.com", "*.taxiger.com", True),
        ("sub.hooks.taxiger.com", "*.taxiger.com", False),    # un seul niveau
        ("taxiger.com", "*.taxiger.com", False),              # pas le domaine root
        ("eviltaxiger.com", "*.taxiger.com", False),
        ("hooks.example.com", "*.taxiger.com", False),
    ],
)
def test_host_matches(host: str, pattern: str, expected: bool) -> None:
    assert host_matches(host, pattern) == expected
