"""Validation d'URL des endpoints webhooks (§9.4a).

Règles :
- HTTPS uniquement
- Nom de domaine (pas d'adresse IP littérale, pas de host numérique déguisé)
- Pas de credentials dans l'URL
- Pas de fragment
- Port 443 par défaut (configurable via settings.webhook_allowed_ports)
- Pas de hostname réservé (.localhost, .local, .internal…)
- Liste blanche facultative (settings.webhook_allowed_hosts)

La résolution DNS est appelée séparément (ssrf.py) pour vérifier que les IP sont publiques.
"""

from __future__ import annotations

import ipaddress

import httpx

from app.config import settings
from app.errors import ApiProblem


class InvalidURL(ApiProblem):
    def __init__(self, code: str) -> None:
        messages = {
            "too_long": "L'URL est trop longue (max 2048 caractères).",
            "https_required": "L'URL doit commencer par https://.",
            "credentials_in_url": "Les identifiants ne sont pas autorisés dans l'URL.",
            "fragment_forbidden": "Les fragments (#) ne sont pas autorisés dans l'URL.",
            "hostname_required": "L'URL doit contenir un nom de domaine (pas une adresse IP).",
            "numeric_host": "Les adresses IP déguisées ne sont pas autorisées.",
            "internal_hostname": "Cette adresse pointe vers un réseau interne.",
            "port_forbidden": "Ce port n'est pas autorisé.",
            "host_not_allowlisted": "Cet hôte ne figure pas dans la liste blanche.",
        }
        super().__init__(422, f"invalid_url.{code}", messages.get(code, code))
        self.url_code = code


FORBIDDEN_SUFFIXES = (".localhost", ".local", ".internal", ".lan", ".home.arpa", ".corp")


def _is_ip_literal(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _allowed_ports() -> set[int]:
    raw = settings.webhook_allowed_ports
    result: set[int] = set()
    for part in raw.split(","):
        part = part.strip()
        if part.isdigit():
            result.add(int(part))
    return result or {443}


def host_matches(host: str, pattern: str) -> bool:
    """Vérifie si `host` correspond au motif.

    - Nom exact : `hooks.taxiger.com` → correspond à `hooks.taxiger.com` uniquement.
    - Motif `*.taxiger.com` → correspond à `foo.taxiger.com` (un seul niveau)
      mais **pas** à `taxiger.com` ni à `bar.foo.taxiger.com`
      ni à `eviltaxiger.com`.
    """
    host = host.lower()
    pattern = pattern.lower()
    if pattern.startswith("*."):
        suffix = pattern[1:]  # ".taxiger.com"
        if not host.endswith(suffix):
            return False
        prefix = host[: -len(suffix)]  # "hooks" pour hooks.taxiger.com
        # Le préfixe doit être non vide et sans point (un seul niveau de sous-domaine).
        return bool(prefix) and "." not in prefix
    return host == pattern


def _check_allowlist(host: str) -> None:
    raw = settings.webhook_allowed_hosts.strip()
    if not raw:
        return  # liste blanche désactivée
    patterns = [p.strip() for p in raw.split(",") if p.strip()]
    if not any(host_matches(host, p) for p in patterns):
        raise InvalidURL("host_not_allowlisted")


def validate_endpoint_url(raw: str) -> tuple[str, str]:
    """Valide l'URL et retourne `(url_normalisée, host)`.

    Lève `InvalidURL` si la validation échoue.
    """
    if len(raw) > 2048:
        raise InvalidURL("too_long")
    url = httpx.URL(raw.strip())
    if url.scheme != "https":
        raise InvalidURL("https_required")
    if url.userinfo:
        raise InvalidURL("credentials_in_url")
    if url.fragment:
        raise InvalidURL("fragment_forbidden")

    # host : IDNA (punycode), minuscules, sans point final
    host = url.raw_host.decode("ascii").rstrip(".").lower()
    if not host or _is_ip_literal(host):
        raise InvalidURL("hostname_required")
    # IP déguisées : 10.1 (sans point final → chiffres uniquement), 0x7f...
    tld = host.rsplit(".", 1)[-1]
    if tld.isdigit() or host.startswith("0x"):
        raise InvalidURL("numeric_host")
    if host == "localhost" or any(host.endswith(s) for s in FORBIDDEN_SUFFIXES):
        raise InvalidURL("internal_hostname")

    port = url.port or 443
    if port not in _allowed_ports():
        raise InvalidURL("port_forbidden")

    _check_allowlist(host)

    # Reconstruire l'URL normalisée (sans les credentials, sans fragment)
    normalized = str(url.copy_with(fragment=""))
    return normalized, host
