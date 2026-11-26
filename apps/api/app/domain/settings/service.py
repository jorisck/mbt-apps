"""Paramètres modifiables dans l'espace de gestion (§14). Lus en base, cache de 30 s par processus."""

from __future__ import annotations

import re
import time
import uuid
from dataclasses import dataclass
from typing import Any

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as env
from app.models import Setting
from app.timeutil import utcnow

CACHE_TTL_S = 30
_E164 = re.compile(r"^\+[1-9]\d{6,14}$")


@dataclass(frozen=True)
class Definition:
    key: str
    label: str
    kind: str  # int | bool | emails | email | phone | text
    default: Any
    low: int | None = None
    high: int | None = None
    help: str = ""


def _default_notification_emails() -> list[str]:
    return env.notify_emails[:5]


DEFINITIONS: dict[str, Definition] = {
    d.key: d
    for d in [
        Definition(
            "company.notification_emails",
            "Adresses recevant les nouvelles demandes",
            "emails",
            _default_notification_emails(),
            1,
            5,
            "1 à 5 adresses, séparées par des virgules.",
        ),
        Definition(
            "company.public_phone",
            "Téléphone affiché aux passagers",
            "phone",
            "+3223153100",
            help="Format international, par exemple +3223153100.",
        ),
        Definition(
            "passenger.cancellation_deadline_hours",
            "Délai d'annulation par le passager (heures avant la prise en charge)",
            "int",
            24,
            0,
            72,
        ),
        Definition("auto_close.enabled", "Clôture automatique des demandes confirmées", "bool", True),
        Definition("auto_close.delay_hours", "Délai de clôture automatique (heures)", "int", 12, 1, 72),
        Definition("requests.stale_alert_minutes", "Alerte pour une demande non traitée (minutes)", "int", 30, 5, 240),
        Definition(
            "requests.correction_window_days",
            "Fenêtre de correction terminée / non effectuée (jours)",
            "int",
            30,
            1,
            90,
        ),
        Definition(
            "requests.min_lead_minutes",
            "Délai minimal entre l'envoi et la prise en charge (minutes)",
            "int",
            60,
            0,
            1440,
        ),
        Definition("retention.demandes_months", "Conservation des demandes (mois)", "int", 12, 1, 60),
        Definition("retention.audit_months", "Conservation du journal d'audit (mois)", "int", 24, 12, 60),
        Definition(
            "retention.inactive_passenger_months",
            "Inactivité avant anonymisation d'un compte passager (mois)",
            "int",
            24,
            6,
            60,
        ),
        Definition("security.contact_email", "Contact de sécurité (copie des alertes)", "email", ""),
        Definition("mobile.min_supported_version", "Version minimale de l'application", "text", "1.0.0"),
    ]
}

_cache: dict[str, tuple[float, Any]] = {}


def clear_cache() -> None:
    _cache.clear()


def validate(key: str, raw: Any) -> Any:
    """Valide et normalise une valeur. Lève ValueError avec un message affichable."""
    definition = DEFINITIONS.get(key)
    if definition is None:
        raise ValueError("Paramètre inconnu.")
    kind = definition.kind
    if kind == "int":
        try:
            value = int(str(raw).strip())
        except ValueError:
            raise ValueError("Saisissez un nombre entier.") from None
        if definition.low is not None and value < definition.low:
            raise ValueError(f"La valeur minimale est {definition.low}.")
        if definition.high is not None and value > definition.high:
            raise ValueError(f"La valeur maximale est {definition.high}.")
        return value
    if kind == "bool":
        if isinstance(raw, bool):
            return raw
        return str(raw).strip().lower() in {"1", "true", "on", "oui", "yes"}
    if kind in {"email", "emails"}:
        items = (
            [i.strip() for i in str(raw).split(",") if i.strip()]
            if kind == "emails"
            else ([str(raw).strip()] if str(raw).strip() else [])
        )
        cleaned = []
        for item in items:
            try:
                cleaned.append(validate_email(item, check_deliverability=False).normalized)
            except EmailNotValidError:
                raise ValueError(f"Adresse e-mail invalide : {item}") from None
        if kind == "emails":
            if not (definition.low <= len(cleaned) <= definition.high):  # type: ignore[operator]
                raise ValueError(f"Indiquez entre {definition.low} et {definition.high} adresses.")
            return cleaned
        return cleaned[0] if cleaned else ""
    if kind == "phone":
        value = re.sub(r"[ .\-]", "", str(raw).strip())
        if not _E164.match(value):
            raise ValueError("Numéro invalide : utilisez le format international (+32…).")
        return value
    value = str(raw).strip()
    if len(value) > 100:
        raise ValueError("Valeur trop longue.")
    return value


async def get_setting(db: AsyncSession, key: str) -> Any:
    now = time.monotonic()
    cached = _cache.get(key)
    if cached and cached[0] > now:
        return cached[1]
    row = await db.get(Setting, key)
    value = row.value if row is not None else DEFINITIONS[key].default
    _cache[key] = (now + CACHE_TTL_S, value)
    return value


async def get_all(db: AsyncSession) -> dict[str, Any]:
    rows = {r.key: r.value for r in (await db.scalars(select(Setting))).all()}
    return {key: rows.get(key, d.default) for key, d in DEFINITIONS.items()}


async def set_setting(db: AsyncSession, key: str, raw: Any, admin_id: uuid.UUID) -> tuple[Any, Any]:
    """Enregistre une valeur validée. Renvoie (avant, après) pour l'audit."""
    value = validate(key, raw)
    before = await db.get(Setting, key)
    old = before.value if before is not None else DEFINITIONS[key].default
    stmt = insert(Setting).values(key=key, value=value, updated_by=admin_id, updated_at=utcnow())
    await db.execute(
        stmt.on_conflict_do_update(
            index_elements=[Setting.key],
            set_={"value": value, "updated_by": admin_id, "updated_at": utcnow()},
        )
    )
    _cache.pop(key, None)
    return old, value
