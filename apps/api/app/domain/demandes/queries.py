"""Lecture des demandes : recherche (§4.3), filtres et raccourcis (§6.3), tableau de bord (§6.2)."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from sqlalchemy import Select, and_, func, literal, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.settings.service import get_setting
from app.models import Admin, Demande, DemandeEvent, DemandeNote, EmailOutbox, WorkerHeartbeat
from app.timeutil import BRUSSELS, utcnow

PAGE_SIZE = 50
_PHONE_QUERY = re.compile(r"^[\d\s.\-+()/]+$")


@dataclass
class DemandeFilters:
    q: str = ""
    statuses: list[str] = field(default_factory=list)
    origins: list[str] = field(default_factory=list)
    pickup_from: date | None = None
    pickup_to: date | None = None
    received_from: date | None = None
    received_to: date | None = None
    has_account: bool | None = None
    wheelchair: bool = False
    auto_closed: bool = False
    shortcut: str = ""  # a_traiter | aujourdhui | demain | a_regulariser
    sort: str = "pickup"  # pickup | received
    page: int = 1


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _like_normalized(term: str):  # noqa: ANN202
    pattern = func.concat("%", func.lower(func.unaccent(literal(_escape_like(term)))), "%")
    return Demande.search_text.like(pattern, escape="\\")


def search_condition(q: str):  # noqa: ANN201
    """Recherche insensible à la casse et aux accents ; termes combinés par ET."""
    q = q.strip()
    if not q:
        return None
    if _PHONE_QUERY.match(q):
        digits = re.sub(r"\D", "", q)
        if len(digits) >= 6:
            patterns = [digits]
            if digits.startswith("0"):
                patterns.append("32" + digits[1:])
            conds = [Demande.search_text.like(f"%{p}%") for p in patterns]
            conds.append(_like_normalized(q))  # une référence ressemble à un nombre (T-2026-000001)
            return or_(*conds)
    terms = [t for t in q.split() if t]
    return and_(*[_like_normalized(t) for t in terms])


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime(day.year, day.month, day.day, tzinfo=BRUSSELS)
    return start, start + timedelta(days=1)


def _brussels_today() -> date:
    return utcnow().astimezone(BRUSSELS).date()


def apply_filters(stmt: Select, f: DemandeFilters) -> Select:  # type: ignore[type-arg]
    now = utcnow()
    if (cond := search_condition(f.q)) is not None:
        stmt = stmt.where(cond)
    if f.statuses:
        stmt = stmt.where(Demande.status.in_(f.statuses))
    if f.origins:
        stmt = stmt.where(Demande.origin.in_(f.origins))
    if f.pickup_from:
        stmt = stmt.where(Demande.pickup_at >= _day_bounds(f.pickup_from)[0])
    if f.pickup_to:
        stmt = stmt.where(Demande.pickup_at < _day_bounds(f.pickup_to)[1])
    if f.received_from:
        stmt = stmt.where(Demande.created_at >= _day_bounds(f.received_from)[0])
    if f.received_to:
        stmt = stmt.where(Demande.created_at < _day_bounds(f.received_to)[1])
    if f.has_account is True:
        stmt = stmt.where(Demande.passenger_id.is_not(None))
    elif f.has_account is False:
        stmt = stmt.where(Demande.passenger_id.is_(None))
    if f.wheelchair:
        stmt = stmt.where(Demande.needs["mobility_aid"].astext.in_(["manual_wheelchair", "electric_wheelchair"]))
    if f.auto_closed:
        stmt = stmt.where(Demande.closed_by == "system")

    today = _brussels_today()
    if f.shortcut == "a_traiter":
        stmt = stmt.where(Demande.status == "received")
    elif f.shortcut == "aujourdhui":
        start, end = _day_bounds(today)
        stmt = stmt.where(
            Demande.pickup_at >= start, Demande.pickup_at < end, Demande.status.in_(["received", "confirmed"])
        )
    elif f.shortcut == "demain":
        start, end = _day_bounds(today + timedelta(days=1))
        stmt = stmt.where(
            Demande.pickup_at >= start, Demande.pickup_at < end, Demande.status.in_(["received", "confirmed"])
        )
    elif f.shortcut == "a_regulariser":
        stmt = stmt.where(Demande.status == "received", Demande.pickup_at < now)
    return stmt


@dataclass
class Page:
    items: list[Demande]
    page: int
    total: int

    @property
    def pages(self) -> int:
        return max(1, -(-self.total // PAGE_SIZE))


async def list_demandes(db: AsyncSession, f: DemandeFilters) -> Page:
    base = apply_filters(select(Demande), f)
    total = int(await db.scalar(select(func.count()).select_from(base.subquery())) or 0)
    order = [Demande.created_at.desc()] if f.sort == "received" else [Demande.pickup_at.asc(), Demande.id]
    page = max(1, f.page)
    rows = (await db.scalars(base.order_by(*order).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE))).all()
    return Page(list(rows), page, total)


@dataclass
class DemandeDetail:
    demande: Demande
    events: list[DemandeEvent]
    notes: list[tuple[DemandeNote, str]]  # (note, nom de l'auteur)
    actor_names: dict[uuid.UUID, str]
    assigned_name: str | None
    emails: list[EmailOutbox]


async def get_detail(db: AsyncSession, demande_id: uuid.UUID) -> DemandeDetail | None:
    d = await db.get(Demande, demande_id)
    if d is None:
        return None
    events = list(
        (await db.scalars(select(DemandeEvent).where(DemandeEvent.demande_id == d.id).order_by(DemandeEvent.id))).all()
    )
    note_rows = (
        await db.execute(
            select(DemandeNote, Admin.full_name)
            .join(Admin, Admin.id == DemandeNote.admin_id)
            .where(DemandeNote.demande_id == d.id, DemandeNote.deleted_at.is_(None))
            .order_by(DemandeNote.created_at)
        )
    ).all()
    admin_ids = {e.actor_id for e in events if e.actor_type == "admin" and e.actor_id}
    if d.assigned_admin_id:
        admin_ids.add(d.assigned_admin_id)
    names: dict[uuid.UUID, str] = {}
    if admin_ids:
        for admin_id, name in (
            await db.execute(select(Admin.id, Admin.full_name).where(Admin.id.in_(admin_ids)))
        ).all():
            names[admin_id] = name
    emails = list(
        (
            await db.scalars(select(EmailOutbox).where(EmailOutbox.demande_id == d.id).order_by(EmailOutbox.created_at))
        ).all()
    )
    return DemandeDetail(
        demande=d,
        events=events,
        notes=[(n, name) for n, name in note_rows],
        actor_names=names,
        assigned_name=names.get(d.assigned_admin_id) if d.assigned_admin_id else None,
        emails=emails,
    )


@dataclass
class Dashboard:
    new_requests: list[Demande]
    today: list[Demande]
    tomorrow: list[Demande]
    to_regularize: list[Demande]
    stale_minutes: int
    new_count: int
    failed_emails: int
    worker_seen_at: datetime | None
    worker_ok: bool


async def dashboard(db: AsyncSession) -> Dashboard:
    now = utcnow()
    today = _brussels_today()
    t_start, t_end = _day_bounds(today)
    m_start, m_end = _day_bounds(today + timedelta(days=1))
    stale = int(await get_setting(db, "requests.stale_alert_minutes"))
    auto_close = bool(await get_setting(db, "auto_close.enabled"))

    new_requests = list(
        (
            await db.scalars(select(Demande).where(Demande.status == "received").order_by(Demande.pickup_at).limit(30))
        ).all()
    )
    new_count = int(await db.scalar(select(func.count()).select_from(Demande).where(Demande.status == "received")) or 0)

    def confirmed_between(start: datetime, end: datetime) -> Select:  # type: ignore[type-arg]
        return (
            select(Demande)
            .where(Demande.status == "confirmed", Demande.pickup_at >= start, Demande.pickup_at < end)
            .order_by(Demande.pickup_at)
        )

    today_list = list((await db.scalars(confirmed_between(t_start, t_end))).all())
    tomorrow_list = list((await db.scalars(confirmed_between(m_start, m_end))).all())

    regularize_cond = and_(Demande.status == "received", Demande.pickup_at < now)
    if not auto_close:
        regularize_cond = or_(regularize_cond, and_(Demande.status == "confirmed", Demande.pickup_at < now))
    to_regularize = list(
        (await db.scalars(select(Demande).where(regularize_cond).order_by(Demande.pickup_at).limit(50))).all()
    )
    failed_emails = int(
        await db.scalar(select(func.count()).select_from(EmailOutbox).where(EmailOutbox.status == "failed")) or 0
    )
    seen = await db.scalar(select(func.max(WorkerHeartbeat.seen_at)))
    return Dashboard(
        new_requests=new_requests,
        today=today_list,
        tomorrow=tomorrow_list,
        to_regularize=to_regularize,
        stale_minutes=stale,
        new_count=new_count,
        failed_emails=failed_emails,
        worker_seen_at=seen,
        worker_ok=seen is not None and now - seen < timedelta(minutes=2),
    )
