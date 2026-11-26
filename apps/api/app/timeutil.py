"""Dates : stockage en UTC, affichage et saisie à l'heure de Bruxelles (§0, §18.7)."""

from __future__ import annotations

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

BRUSSELS = ZoneInfo("Europe/Brussels")


class NonexistentLocalTime(ValueError):
    """Heure locale qui n'existe pas (passage à l'heure d'été)."""


def utcnow() -> datetime:
    return datetime.now(UTC)


def parse_brussels_local(value: str) -> datetime:
    """`AAAA-MM-JJTHH:MM` (heure de Bruxelles, sans décalage) -> datetime UTC.

    Une heure ambiguë (passage à l'heure d'hiver) est lue comme la première occurrence.
    Une heure inexistante lève `NonexistentLocalTime`.
    """
    naive = datetime.fromisoformat(value)
    if naive.tzinfo is not None:
        raise ValueError("l'heure doit être locale, sans décalage")
    aware = naive.replace(tzinfo=BRUSSELS, fold=0)
    roundtrip = aware.astimezone(UTC).astimezone(BRUSSELS).replace(tzinfo=None)
    if roundtrip != naive:
        raise NonexistentLocalTime(value)
    return aware.astimezone(UTC)


def to_brussels(dt: datetime) -> datetime:
    return dt.astimezone(BRUSSELS)


def fmt_brussels(dt: datetime | None, with_time: bool = True) -> str:
    """`jj/mm/aaaa HH:mm`."""
    if dt is None:
        return ""
    local = to_brussels(dt)
    return local.strftime("%d/%m/%Y %H:%M" if with_time else "%d/%m/%Y")


def fmt_input_local(dt: datetime | None) -> str:
    if dt is None:
        return ""
    return to_brussels(dt).strftime("%Y-%m-%dT%H:%M")
