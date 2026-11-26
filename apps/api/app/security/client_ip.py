"""IP du client : DERNIÈRE valeur de X-Forwarded-For, ajoutée par le routeur Heroku (§10.8).

Ne jamais utiliser `request.client.host` derrière uvicorn avec `--forwarded-allow-ips="*"` :
il retient la première valeur, que le client peut falsifier.
"""

from __future__ import annotations

import ipaddress

from starlette.requests import Request


def client_ip(request: Request) -> str | None:
    header = request.headers.get("x-forwarded-for")
    candidate: str | None = None
    if header:
        candidate = header.split(",")[-1].strip()
    elif request.client:
        candidate = request.client.host
    if not candidate:
        return None
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None
