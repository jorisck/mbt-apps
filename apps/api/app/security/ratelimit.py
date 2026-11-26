"""Limitation de débit : compteurs en PostgreSQL, fenêtres fixes (§10.8)."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def hit(db: AsyncSession, bucket: str, window_s: int) -> int:
    """Incrémente le compteur du seau pour la fenêtre courante et renvoie le total."""
    result = await db.execute(
        text(
            """
            INSERT INTO rate_limits (bucket, window_start, hits)
            VALUES (:bucket, to_timestamp(floor(extract(epoch FROM now()) / :w) * :w), 1)
            ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limits.hits + 1
            RETURNING hits
            """
        ),
        {"bucket": bucket, "w": window_s},
    )
    return int(result.scalar_one())


async def current(db: AsyncSession, bucket: str, window_s: int) -> int:
    """Lit le compteur sans l'incrémenter."""
    result = await db.execute(
        text(
            """
            SELECT hits FROM rate_limits
            WHERE bucket = :bucket
              AND window_start = to_timestamp(floor(extract(epoch FROM now()) / :w) * :w)
            """
        ),
        {"bucket": bucket, "w": window_s},
    )
    return int(result.scalar() or 0)
