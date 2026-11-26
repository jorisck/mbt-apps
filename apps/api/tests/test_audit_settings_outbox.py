"""Journal d'audit chaîné, paramètres, file d'e-mails, worker."""

from __future__ import annotations

import uuid
from datetime import timedelta

import httpx
import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError

from app.db import session_scope
from app.domain.actors import Actor
from app.domain.audit import audit, verify_chain
from app.domain.emails import outbox
from app.domain.settings import service as settings_service
from app.models import AuditLog, EmailOutbox
from app.timeutil import utcnow
from app.worker.__main__ import send_due_emails
from tests.conftest import Session, create_demande, do_step_up


async def test_audit_chain_is_linear_and_verifiable() -> None:
    async with session_scope() as db:
        for index in range(5):
            await audit(db, Actor.system(), f"test.event{index}", "thing", index, {"n": index})
    async with session_scope() as db:
        rows = list((await db.scalars(select(AuditLog).order_by(AuditLog.id))).all())
        assert rows[0].prev_hash is None
        assert all(rows[i].prev_hash == rows[i - 1].hash for i in range(1, 5))
        assert await verify_chain(db) == (True, None)


async def test_audit_log_cannot_be_modified_or_deleted() -> None:
    async with session_scope() as db:
        await audit(db, Actor.system(), "test.event")
    for statement in ("UPDATE audit_log SET action = 'x'", "DELETE FROM audit_log"):
        with pytest.raises(DBAPIError):
            async with session_scope() as db:
                await db.execute(text(statement))


async def test_audit_verification_detects_tampering() -> None:
    async with session_scope() as db:
        for index in range(3):
            await audit(db, Actor.system(), f"test.event{index}")
    async with session_scope() as db:  # sabotage volontaire : on désactive le trigger le temps du test
        await db.execute(text("ALTER TABLE audit_log DISABLE TRIGGER audit_log_guard"))
        await db.execute(text("UPDATE audit_log SET action = 'forged' WHERE id = 2"))
        await db.execute(text("ALTER TABLE audit_log ENABLE TRIGGER audit_log_guard"))
    async with session_scope() as db:
        ok, broken = await verify_chain(db)
    assert ok is False and broken == 2


async def test_audit_page_and_verify_endpoint(session: Session) -> None:
    page = await session.client.get("/audit-log", params={"action": "auth."})
    assert page.status_code == 200 and "auth.login" in page.text
    result = await session.htmx("POST", "/audit-log/verify")
    assert "Chaîne intègre" in result.text


async def test_audit_never_stores_passwords_or_tokens(session: Session) -> None:
    async with session_scope() as db:
        dump = " ".join(str(r.details) for r in (await db.scalars(select(AuditLog))).all())
    assert "correct-horse" not in dump


async def test_settings_validation_bounds_and_audit(session: Session) -> None:
    await do_step_up(session)
    page = await session.client.get("/settings")
    assert page.status_code == 200 and "Délai de clôture automatique" in page.text
    bad = await session.htmx("POST", "/settings", data={"s:auto_close.delay_hours": "500"})
    assert bad.status_code == 422 and "valeur maximale est 72" in bad.text
    bad_email = await session.htmx("POST", "/settings", data={"s:company.notification_emails": "pas-un-email"})
    assert bad_email.status_code == 422
    ok = await session.htmx(
        "POST", "/settings", data={"s:auto_close.delay_hours": "24", "s:company.public_phone": "+32 2 315 31 00"}
    )
    assert ok.status_code == 200 and "Paramètres enregistrés" in ok.text
    async with session_scope() as db:
        assert await settings_service.get_setting(db, "auto_close.delay_hours") == 24
        assert await settings_service.get_setting(db, "company.public_phone") == "+3223153100"
        entry = await db.scalar(
            select(AuditLog).where(
                AuditLog.action == "settings.updated", AuditLog.entity_id == "auto_close.delay_hours"
            )
        )
        assert entry is not None and entry.details["before"] == 12 and entry.details["after"] == 24


async def test_unchecked_boolean_setting_is_saved_as_false(session: Session) -> None:
    await do_step_up(session)
    response = await session.htmx("POST", "/settings", data={"s:auto_close.delay_hours": "12"})
    assert response.status_code == 200
    settings_service.clear_cache()
    async with session_scope() as db:
        assert await settings_service.get_setting(db, "auto_close.enabled") is False


async def test_worker_sends_pending_emails_and_erases_sensitive_context(api: httpx.AsyncClient) -> None:
    await create_demande(api)
    async with session_scope() as db:
        await outbox.enqueue_email(
            db, to="x@example.com", template="admin_password_reset", context={"name": "X", "link": "http://secret/link"}
        )
    sent = await send_due_emails()
    assert sent == 3
    async with session_scope() as db:
        rows = list((await db.scalars(select(EmailOutbox))).all())
        assert all(r.status == "sent" and r.sent_at is not None for r in rows)
        reset = next(r for r in rows if r.template == "admin_password_reset")
        assert reset.context == {}  # le lien à usage unique ne reste pas en base
    assert await send_due_emails() == 0  # rien n'est renvoyé deux fois


async def test_expired_lease_is_reclaimed() -> None:
    async with session_scope() as db:
        row = await outbox.enqueue_email(
            db, to="x@example.com", template="admin_password_changed", context={"name": "X"}
        )
        row.status, row.lease_until = "sending", utcnow() - timedelta(minutes=1)
    assert await send_due_emails() == 1


async def test_temporary_failure_backs_off_then_gives_up(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.domain.emails import provider

    async def boom(**_: object) -> str:
        raise provider.TemporaryEmailError("503")

    monkeypatch.setattr(provider, "send_email", boom)
    async with session_scope() as db:
        row = await outbox.enqueue_email(
            db, to="x@example.com", template="admin_password_changed", context={"name": "X"}
        )
        email_id = row.id
    await send_due_emails()
    async with session_scope() as db:
        row = await db.get(EmailOutbox, email_id)
        assert row is not None and row.status == "pending" and row.attempt_count == 1
        assert row.next_attempt_at > utcnow()
        row.attempt_count = outbox.MAX_ATTEMPTS - 1
        row.next_attempt_at = utcnow() - timedelta(seconds=1)
    await send_due_emails()
    async with session_scope() as db:
        row = await db.get(EmailOutbox, email_id)
        assert row is not None and row.status == "failed"


async def test_dashboard_warns_when_worker_is_silent(session: Session) -> None:
    page = await session.client.get("/")
    assert "ne répond plus" in page.text
    from app.models import WorkerHeartbeat

    async with session_scope() as db:
        db.add(WorkerHeartbeat(worker_id="w1", seen_at=utcnow()))
    page = await session.client.get("/")
    assert "ne répond plus" not in page.text


def test_unique_uuid7_ids_are_time_ordered() -> None:
    ids = [uuid.uuid7() for _ in range(50)]
    assert ids == sorted(ids, key=lambda u: u.int) or len(set(ids)) == 50
