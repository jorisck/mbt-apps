"""Envoi HTTP d'un webhook : résolution, épinglage IP, TLS, timeout (§9.4b, §8.5).

Points clés :
- trust_env=False : ignore HTTP(S)_PROXY.
- follow_redirects=False : une redirection 3xx est un échec.
- Timeout 10 s (réponse) / 5 s (connexion), plafond global 15 s.
- max_keepalive_connections=0 : pas de réutilisation de connexion TLS entre hôtes.
- Connexion à l'IP validée avec le vrai nom dans Host + SNI.
- Réponse lue jusqu'à MAX_RESPONSE_BYTES, extrait échappé pour les logs.
"""

from __future__ import annotations

import html
import re
import ssl
import time
from dataclasses import dataclass

import anyio
import certifi
import httpx

from app.domain.webhooks.ssrf import DeliveryError, IPPolicy, resolve_public_ips

MAX_RESPONSE_BYTES = 64 * 1024
_EXTERNAL_ID_RE = re.compile(r'^[A-Za-z0-9._:\-]{1,100}$')

# SSL : TLS 1.2 minimum, certificat vérifié contre les autorités publiques.
_SSL_CTX = ssl.create_default_context(cafile=certifi.where())
_SSL_CTX.minimum_version = ssl.TLSVersion.TLSv1_2

_client = httpx.AsyncClient(
    verify=_SSL_CTX,
    trust_env=False,                           # ignore HTTP(S)_PROXY
    follow_redirects=False,                    # une redirection est un échec
    timeout=httpx.Timeout(10.0, connect=5.0),
    limits=httpx.Limits(max_connections=20, max_keepalive_connections=0),
)


@dataclass
class AttemptResult:
    success: bool
    http_status: int | None = None
    error_type: str | None = None
    response_excerpt: str | None = None
    resolved_ip: str | None = None
    duration_ms: int = 0
    external_id: str | None = None

    @classmethod
    def failure(
        cls,
        code: str,
        resolved_ip: str | None,
        started: float,
        http_status: int | None = None,
        excerpt: str | None = None,
    ) -> AttemptResult:
        return cls(
            success=False,
            http_status=http_status,
            error_type=code,
            response_excerpt=excerpt,
            resolved_ip=resolved_ip,
            duration_ms=int((time.monotonic() - started) * 1000),
        )

    @classmethod
    def from_response(
        cls,
        response: httpx.Response,
        raw: bytes,
        resolved_ip: str | None,
        started: float,
    ) -> AttemptResult:
        duration_ms = int((time.monotonic() - started) * 1000)
        status = response.status_code
        success = 200 <= status < 300
        error_type: str | None = None
        if not success:
            error_type = "redirect" if 300 <= status < 400 else "http_error"
        excerpt = _safe_excerpt(raw)
        external_id = _extract_external_id(raw) if success else None
        return cls(
            success=success,
            http_status=status,
            error_type=error_type,
            response_excerpt=excerpt,
            resolved_ip=resolved_ip,
            duration_ms=duration_ms,
            external_id=external_id,
        )


def _safe_excerpt(raw: bytes, max_len: int = 500) -> str | None:
    """Retourne un extrait textuel échappé de la réponse brute, sans données personnelles."""
    if not raw:
        return None
    try:
        text_val = raw[:max_len].decode("utf-8", errors="replace")
    except Exception:
        return None
    return html.escape(text_val)


def _extract_external_id(raw: bytes) -> str | None:
    """Extrait `external_id` d'une réponse JSON 2xx si elle respecte le format attendu."""
    import json

    if not raw:
        return None
    try:
        data = json.loads(raw[:MAX_RESPONSE_BYTES])
    except Exception:
        return None
    if not isinstance(data, dict):
        return None
    value = data.get("external_id")
    if not isinstance(value, str):
        return None
    if _EXTERNAL_ID_RE.match(value):
        return value
    return None


async def deliver(
    url: str,
    body: bytes,
    headers: dict[str, str],
    *,
    ip_policy: IPPolicy | None = None,
) -> AttemptResult:
    """Envoie `body` à `url` avec les `headers` fournis.

    Résout le DNS, filtre les IP privées, épingle l'IP, vérifie le TLS sur le vrai nom.
    `ip_policy` est réservé aux tests (jamais configuré via l'environnement).
    """
    target = httpx.URL(url)
    host = target.host
    port = target.port or 443
    started = time.monotonic()
    resolved_ip: str | None = None
    try:
        with anyio.fail_after(15):
            ips = await resolve_public_ips(host, port, ip_policy=ip_policy)
            resolved_ip = ips[0]
            request = _client.build_request(
                "POST",
                target.copy_with(host=resolved_ip),  # connexion à l'IP validée
                content=body,
                headers={**headers, "Host": host},
                extensions={"sni_hostname": host},   # SNI et certificat sur le vrai nom
            )
            response = await _client.send(request, stream=True)
            try:
                raw = await _read_capped(response, MAX_RESPONSE_BYTES)
            finally:
                await response.aclose()
    except DeliveryError as exc:
        return AttemptResult.failure(exc.code, resolved_ip, started)
    except (TimeoutError, httpx.TimeoutException):
        return AttemptResult.failure("timeout", resolved_ip, started)
    except httpx.ConnectError as exc:
        kind = "tls" if isinstance(exc.__cause__, ssl.SSLError) or "SSL" in str(exc) else "connect"
        return AttemptResult.failure(kind, resolved_ip, started)
    except httpx.HTTPError:
        return AttemptResult.failure("connect", resolved_ip, started)
    return AttemptResult.from_response(response, raw, resolved_ip, started)


async def _read_capped(response: httpx.Response, limit: int) -> bytes:
    """Lit la réponse jusqu'à `limit` octets (aucune décompression : Accept-Encoding: identity)."""
    chunks: list[bytes] = []
    size = 0
    async for chunk in response.aiter_raw():
        size += len(chunk)
        if size > limit:
            break
        chunks.append(chunk)
    return b"".join(chunks)
