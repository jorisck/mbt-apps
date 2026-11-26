"""Moteur SQLAlchemy async, sessions."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def create_engine(url: str | None = None) -> AsyncEngine:
    return create_async_engine(
        settings.async_url(url),
        connect_args=settings.db_connect_args(url),
        pool_size=settings.db_pool_size,
        max_overflow=0,
        pool_pre_ping=True,
    )


def get_engine() -> AsyncEngine:
    global _engine, _sessionmaker
    if _engine is None:
        _engine = create_engine()
        _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def set_engine(engine: AsyncEngine) -> None:
    """Utilisé par les tests pour pointer vers la base de test."""
    global _engine, _sessionmaker
    _engine = engine
    _sessionmaker = async_sessionmaker(engine, expire_on_commit=False)


async def dispose_engine() -> None:
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None


def session_factory() -> async_sessionmaker[AsyncSession]:
    get_engine()
    assert _sessionmaker is not None
    return _sessionmaker


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Une transaction : commit si tout va bien, rollback sinon."""
    async with session_factory()() as session, session.begin():
        yield session


async def get_db() -> AsyncIterator[AsyncSession]:
    """Dépendance FastAPI : la transaction couvre toute la requête."""
    async with session_scope() as session:
        yield session
