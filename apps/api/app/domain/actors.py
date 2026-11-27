"""Acteur d'une action : admin, passager, invité ou système."""

from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class Actor:
    type: str  # admin | passenger | guest | system | anonymous
    id: uuid.UUID | None = None
    ip: str | None = None
    user_agent: str | None = None

    @classmethod
    def system(cls) -> Actor:
        return cls("system")

    @classmethod
    def guest(cls, ip: str | None = None) -> Actor:
        return cls("guest", None, ip)

    @classmethod
    def admin(cls, admin_id: uuid.UUID, ip: str | None = None, ua: str | None = None) -> Actor:
        return cls("admin", admin_id, ip, ua)

    @classmethod
    def passenger(cls, passenger_id: uuid.UUID, ip: str | None = None, ua: str | None = None) -> Actor:
        return cls("passenger", passenger_id, ip, ua)
