"""Middlewares ASGI : taille des requêtes (§10.11) et en-têtes de sécurité (§10.7)."""

from __future__ import annotations

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

MAX_BODY_BYTES = 64 * 1024

ADMIN_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "Content-Security-Policy": (
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
        "connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
    ),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Robots-Tag": "noindex, nofollow",
}

API_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
}


class BodyLimitMiddleware:
    """Refuse les corps de plus de 64 Ko (en-tête Content-Length puis lecture réelle)."""

    def __init__(self, app: ASGIApp, max_bytes: int = MAX_BODY_BYTES) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        declared = headers.get(b"content-length")
        if declared is not None and declared.isdigit() and int(declared) > self.max_bytes:
            await self._reject(send)
            return

        received = 0
        too_large = False

        async def limited_receive() -> Message:
            nonlocal received, too_large
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_bytes:
                    too_large = True
                    return {"type": "http.request", "body": b"", "more_body": False}
            return message

        started = False

        async def guarded_send(message: Message) -> None:
            nonlocal started
            if too_large and not started:
                started = True
                await self._reject(send)
                return
            if too_large:
                return
            started = started or message["type"] == "http.response.start"
            await send(message)

        await self.app(scope, limited_receive, guarded_send)

    @staticmethod
    async def _reject(send: Send) -> None:
        body = b'{"type":"about:blank","title":"payload_too_large","status":413,"code":"payload_too_large"}'
        await send(
            {
                "type": "http.response.start",
                "status": 413,
                "headers": [
                    (b"content-type", b"application/problem+json"),
                    (b"content-length", str(len(body)).encode()),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp, headers: dict[str, str]) -> None:
        self.app = app
        self.extra = headers

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def wrapped(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                for name, value in self.extra.items():
                    headers.setdefault(name, value)
            await send(message)

        await self.app(scope, receive, wrapped)
