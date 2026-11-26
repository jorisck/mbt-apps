"""Supervision : GET /healthz, publique, sans aucun détail (§7.2)."""

from __future__ import annotations

from fastapi.responses import PlainTextResponse
from sqlalchemy import text

from app.db import session_scope


async def healthz() -> PlainTextResponse:
    try:
        async with session_scope() as db:
            await db.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - aucun détail n'est exposé
        return PlainTextResponse("unavailable", status_code=503)
    return PlainTextResponse("OK")
