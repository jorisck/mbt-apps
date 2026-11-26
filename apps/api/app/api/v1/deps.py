"""Identification du client de l'API publique : site (clé X-Client-Key) ou application (§18.4)."""

from __future__ import annotations

import hmac
import ipaddress
import re
from dataclasses import dataclass

from fastapi import Request

from app.config import settings
from app.errors import ApiProblem
from app.security.client_ip import client_ip

_VERSION = re.compile(r"^\d+(\.\d+){0,2}$")


@dataclass(frozen=True)
class ClientInfo:
    origin: str  # site_mbt | site_handycab | app_ios | app_android
    ip: str | None  # IP du visiteur final, pour la limitation de débit
    is_app: bool
    app_version: str | None = None


def _match_key(presented: str) -> str | None:
    found: str | None = None
    for key, origin in settings.bff_key_map.items():
        if hmac.compare_digest(key.encode(), presented.encode()):
            found = origin
    return found


def _valid_ip(raw: str | None) -> str | None:
    if not raw:
        return None
    try:
        return str(ipaddress.ip_address(raw.strip()))
    except ValueError:
        return None


async def get_client(request: Request) -> ClientInfo:
    key = request.headers.get("x-client-key")
    if key:
        origin = _match_key(key)
        if origin is None:
            raise ApiProblem(401, "invalid_client_key", "Clé de site invalide.")
        # L'IP transmise par le site n'est crue que parce que la clé est valide (§18.4).
        ip = _valid_ip(request.headers.get("x-end-user-ip")) or client_ip(request)
        return ClientInfo(origin=origin, ip=ip, is_app=False)

    platform = (request.headers.get("x-app-platform") or "").lower()
    if platform in {"ios", "android"}:
        version = request.headers.get("x-app-version")
        if version is not None and not _VERSION.match(version):
            version = None
        return ClientInfo(origin=f"app_{platform}", ip=client_ip(request), is_app=True, app_version=version)
    raise ApiProblem(401, "client_required", "Client non identifié.")


def version_tuple(value: str) -> tuple[int, ...]:
    return tuple(int(part) for part in value.split("."))
