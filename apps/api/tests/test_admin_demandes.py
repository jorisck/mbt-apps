"""Liste, recherche, fiche, transitions, notes, export CSV."""

from __future__ import annotations

import csv
import io
import uuid
from datetime import timedelta

import httpx
import pytest
from sqlalchemy import select, update

from app.db import session_scope
from app.domain.demandes import state_machine as sm
from app.models import Demande, EmailOutbox
from app.timeutil import utcnow
from tests.conftest import Session, create_demande, do_step_up


async def revision(demande_id: str) -> int:
    async with session_scope() as db:
        d = await db.get(Demande, uuid.UUID(demande_id))
        assert d is not None
        return d.revision


async def transition(s: Session, demande_id: str, to: str, **data: str) -> httpx.Response:
    return await s.htmx(
        "POST",
        f"/demandes/{demande_id}/transition",
        data={"to": to, "revision": str(await revision(demande_id)), **data},
    )


async def test_dashboard_lists_new_requests(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    page = await session.client.get("/")
    assert created["reference"] in page.text
    fragment = await session.htmx("GET", "/fragments/dashboard")
    assert created["reference"] in fragment.text and 'data-new-count="1"' in fragment.text


async def test_list_search_is_accent_and_case_insensitive(session: Session, api: httpx.AsyncClient) -> None:
    payload = {
        "first_name": "Éloïse",
        "last_name": "Van den Bossche",
        "phone": "+32 470 12 34 56",
        "email": "eloise@example.com",
        "language": "fr",
    }
    created = await create_demande(api, passenger=payload)
    other = await create_demande(
        api,
        passenger={
            "first_name": "Marie",
            "last_name": "Dupont",
            "phone": "0499 99 99 99",
            "email": "marie@example.com",
            "language": "fr",
        },
    )
    for query in (
        "eloise",
        "ÉLOÏSE",
        "bossche",
        "0470123456",
        "+32470123456",
        "0470 12 34 56",
        created["reference"],
        "eloise@example",
        "loi 16",
    ):
        page = await session.client.get("/demandes", params={"q": query})
        assert created["reference"] in page.text, query
        assert other["reference"] not in page.text or query == "loi 16", query


async def test_filters_and_pagination_params_are_validated(session: Session) -> None:
    page = await session.client.get(
        "/demandes", params={"status": ["bogus", "received"], "pickup_from": "not-a-date", "page": "-4", "sort": "x"}
    )
    assert page.status_code == 200


async def test_htmx_list_returns_fragment_only(session: Session, api: httpx.AsyncClient) -> None:
    await create_demande(api)
    fragment = await session.htmx("GET", "/demandes", headers={"HX-Target": "demandes-results"})
    assert "<html" not in fragment.text and "demande" in fragment.text


async def test_detail_page_shows_actions_for_received(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    page = await session.client.get(f"/demandes/{created['id']}")
    assert page.status_code == 200 and "Confirmer" in page.text and "Refuser" in page.text
    assert page.headers["etag"] == '"1"'
    assert (await session.client.get(f"/demandes/{uuid.uuid4()}")).status_code == 404


async def test_confirm_updates_status_history_and_emails_passenger(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    response = await transition(session, created["id"], "confirmed")
    assert response.status_code == 200 and "Statut mis à jour" in response.text
    async with session_scope() as db:
        d = await db.get(Demande, uuid.UUID(created["id"]))
        assert d is not None and d.status == "confirmed" and d.revision == 2
        templates = list((await db.scalars(select(EmailOutbox.template))).all())
        assert "demande_confirmed" in templates


async def test_refuse_requires_reason_and_sends_it(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    no_reason = await transition(session, created["id"], "refused")
    assert no_reason.status_code == 422
    other_without_text = await transition(session, created["id"], "refused", reason_choice="Autre")
    assert other_without_text.status_code == 422
    unknown_reason = await transition(session, created["id"], "refused", reason_choice="Parce que")
    assert unknown_reason.status_code == 422
    ok = await transition(session, created["id"], "refused", reason_choice="Hors zone desservie")
    assert ok.status_code == 200
    async with session_scope() as db:
        d = await db.get(Demande, uuid.UUID(created["id"]))
        assert d is not None and d.status == "refused" and d.refusal_reason == "Hors zone desservie"


async def test_stale_revision_is_refused_with_412(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    response = await session.htmx(
        "POST", f"/demandes/{created['id']}/transition", data={"to": "confirmed", "revision": "99"}
    )
    assert response.status_code == 412
    assert response.headers["hx-retarget"] == "#flash"
    assert "modifiée" in response.text


async def test_two_admins_cannot_both_win(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    stale = await revision(created["id"])
    assert (await transition(session, created["id"], "confirmed")).status_code == 200
    second = await session.htmx(
        "POST",
        f"/demandes/{created['id']}/transition",
        data={"to": "refused", "revision": str(stale), "reason_choice": "Hors zone desservie"},
    )
    assert second.status_code == 412


@pytest.mark.parametrize("source", sm.STATUSES)
@pytest.mark.parametrize("target", sm.STATUSES)
async def test_state_machine_matrix_matches_database(
    session: Session, api: httpx.AsyncClient, source: str, target: str
) -> None:
    created = await create_demande(api)
    now = utcnow()
    async with session_scope() as db:  # on place la demande dans l'état de départ, heure passée
        await db.execute(
            update(Demande)
            .where(Demande.id == uuid.UUID(created["id"]))
            .values(
                status=source,
                pickup_at=now - timedelta(hours=2),
                closed_at=now if source in sm.FINAL else None,
                closed_by="admin" if source in sm.FINAL else None,
            )
        )
    allowed = "admin" in sm.TRANSITIONS.get((source, target), set())
    response = await transition(session, created["id"], target, reason_choice="Autre", reason_text="motif de test")
    if allowed:
        assert response.status_code == 200, (source, target, response.text)
    else:
        assert response.status_code == 409, (source, target, response.status_code)


async def test_final_states_have_no_action_buttons_except_corrections(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    await transition(session, created["id"], "refused", reason_choice="Hors zone desservie")
    page = await session.client.get(f"/demandes/{created['id']}")
    assert "clôturée" in page.text and "/transition" not in page.text


async def test_cannot_complete_before_pickup(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    assert (await transition(session, created["id"], "confirmed")).status_code == 200
    page = await session.client.get(f"/demandes/{created['id']}")
    assert "Marquer terminée" not in page.text
    response = await transition(session, created["id"], "completed")
    assert response.status_code == 422


async def test_notes_add_and_delete_own_only(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    added = await session.htmx(
        "POST", f"/demandes/{created['id']}/notes", data={"body": "Appeler avant <b>d'arriver</b>"}
    )
    assert added.status_code == 200
    assert "&lt;b&gt;" in added.text and "<b>d'arriver" not in added.text  # échappement
    empty = await session.htmx("POST", f"/demandes/{created['id']}/notes", data={"body": "   "})
    assert empty.status_code == 422
    from app.models import DemandeNote

    async with session_scope() as db:
        note = await db.scalar(select(DemandeNote))
        assert note is not None
    assert (await session.htmx("POST", f"/demandes/{created['id']}/notes/{note.id}/delete")).status_code == 200
    async with session_scope() as db:
        assert (await db.get(DemandeNote, note.id)).deleted_at is not None  # type: ignore[union-attr]
    page = await session.client.get(f"/demandes/{created['id']}")
    assert "Appeler avant" not in page.text


async def test_assign_and_release(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(api)
    mine = await session.htmx(
        "POST", f"/demandes/{created['id']}/assign", data={"revision": str(await revision(created["id"]))}
    )
    assert mine.status_code == 200 and "Alice Martin" in mine.text
    released = await session.htmx(
        "POST",
        f"/demandes/{created['id']}/assign",
        data={"revision": str(await revision(created["id"])), "release": "1"},
    )
    assert "Pris en charge par" not in released.text


async def test_xss_in_passenger_fields_is_escaped(session: Session, api: httpx.AsyncClient) -> None:
    created = await create_demande(
        api,
        passenger={
            "first_name": "<script>alert(1)</script>",
            "last_name": "Dupont",
            "phone": "0470123456",
            "email": "x@example.com",
            "language": "fr",
        },
        comment="<img src=x onerror=alert(1)>",
    )
    for url in ("/demandes", f"/demandes/{created['id']}", "/"):
        text = (await session.client.get(url)).text
        assert "<script>alert(1)" not in text and "<img src=x" not in text


async def test_csv_export_neutralises_formulas_and_is_audited(session: Session, api: httpx.AsyncClient) -> None:
    await create_demande(
        api,
        passenger={
            "first_name": '=HYPERLINK("http://evil")',
            "last_name": "Test",
            "phone": "0470123456",
            "email": "csv@example.com",
            "language": "fr",
        },
        needs={"mobility_aid": "manual_wheelchair"},
        health_consent=True,
    )
    await do_step_up(session)
    plain = await session.client.get("/demandes/export.csv")
    assert plain.status_code == 200 and plain.headers["content-type"].startswith("text/csv")
    rows = list(csv.reader(io.StringIO(plain.text.lstrip("\ufeff"))))
    assert rows[0][0] == "Référence" and "Besoins" not in rows[0]
    assert rows[1][6].startswith("'=HYPERLINK")
    health = await session.client.get("/demandes/export.csv", params={"include_health": "1"})
    assert "Besoins" in health.text.splitlines()[0]
    from app.models import AuditLog

    async with session_scope() as db:
        actions = list((await db.scalars(select(AuditLog.action))).all())
        assert actions.count("demande.exported") == 2
