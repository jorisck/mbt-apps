"""Worker : envoie les e-mails de la file (outbox) et signale sa présence (§3.3).

Lancé par `python -m app.worker` (process `worker` du Procfile). Plusieurs instances peuvent
tourner en parallèle : la réservation utilise `FOR UPDATE SKIP LOCKED`.
"""

from __future__ import annotations

import asyncio
import os
import signal
import socket
from datetime import timedelta

import structlog
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from app.db import dispose_engine, session_scope
from app.domain.emails import outbox
from app.logging_config import configure_logging, init_sentry
from app.models import WorkerHeartbeat
from app.timeutil import utcnow

log = structlog.get_logger("worker")

POLL_SECONDS = 5
HEARTBEAT_SECONDS = 30
HEARTBEAT_RETENTION_HOURS = 24


async def heartbeat(worker_id: str) -> None:
    now = utcnow()
    async with session_scope() as db:
        await db.execute(
            insert(WorkerHeartbeat)
            .values(worker_id=worker_id, seen_at=now)
            .on_conflict_do_update(index_elements=[WorkerHeartbeat.worker_id], set_={"seen_at": now})
        )
        await db.execute(
            delete(WorkerHeartbeat).where(
                WorkerHeartbeat.worker_id != worker_id,
                WorkerHeartbeat.seen_at < now - timedelta(hours=HEARTBEAT_RETENTION_HOURS),
            )
        )


async def send_due_emails() -> int:
    async with session_scope() as db:
        await outbox.reclaim_expired_leases(db)
        claimed = await outbox.claim_due(db)
    sent = 0
    for email_id in claimed:  # une transaction par e-mail : un échec n'en bloque pas d'autres
        try:
            async with session_scope() as db:
                if await outbox.deliver(db, email_id):
                    sent += 1
        except Exception:  # noqa: BLE001
            log.exception("email.deliver_crashed", id=str(email_id))
    return sent


async def run() -> None:
    configure_logging()
    init_sentry()
    worker_id = f"{socket.gethostname()}:{os.getpid()}"
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)

    log.info("worker.started", worker_id=worker_id)
    last_beat = 0.0
    try:
        while not stop.is_set():
            try:
                now = loop.time()
                if now - last_beat >= HEARTBEAT_SECONDS:
                    await heartbeat(worker_id)
                    last_beat = now
                await send_due_emails()
            except Exception:  # noqa: BLE001 - la boucle ne doit jamais s'arrêter
                log.exception("worker.tick_failed")
            try:
                await asyncio.wait_for(stop.wait(), timeout=POLL_SECONDS)
            except TimeoutError:
                pass
    finally:
        log.info("worker.stopped", worker_id=worker_id)
        await dispose_engine()


if __name__ == "__main__":
    asyncio.run(run())
