"""Worker : envoie les e-mails de la file (outbox), signale sa présence (§3.3)
et exécute les tâches planifiées (§12).

Lancé par `python -m app.worker` (process `worker` du Procfile). Plusieurs instances peuvent
tourner en parallèle : la réservation utilise `FOR UPDATE SKIP LOCKED` et les tâches planifiées
utilisent `pg_try_advisory_lock`.

Arrêt propre (§12.3) : sur SIGTERM/SIGINT, on cesse d'accepter de nouveaux envois ;
la boucle termine l'itération en cours, puis on dispose le moteur et on quitte.
Heroku laisse 30 s avant SIGKILL : le délai de grâce interne est de 20 s.
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
from app.worker import jobs as _jobs

log = structlog.get_logger("worker")

POLL_SECONDS = 5
HEARTBEAT_SECONDS = 30
HEARTBEAT_RETENTION_HOURS = 24
SHUTDOWN_GRACE_SECONDS = 20.0


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


async def _run_scheduled_jobs() -> None:
    """Lance toutes les tâches planifiées (chacune vérifie si elle est due)."""
    await _jobs.run_job(
        "reclaim_expired_leases",
        _jobs.SCHEDULE_RECLAIM,
        _jobs.job_reclaim_expired_leases,
    )
    await _jobs.run_job(
        "deliver_webhooks",
        _jobs.SCHEDULE_WEBHOOKS,
        _jobs.job_deliver_webhooks,
    )
    await _jobs.run_job(
        "alert_stale_requests",
        _jobs.SCHEDULE_ALERT_STALE,
        _jobs.job_alert_stale_requests,
    )
    await _jobs.run_job(
        "auto_close_demandes",
        _jobs.SCHEDULE_AUTO_CLOSE,
        _jobs.job_auto_close_demandes,
    )
    await _jobs.run_job(
        "retention_purge",
        _jobs.SCHEDULE_RETENTION,
        _jobs.job_retention_purge,
    )
    await _jobs.run_job(
        "daily_digest",
        _jobs.SCHEDULE_DAILY_DIGEST,
        _jobs.job_daily_digest,
    )


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
                await _run_scheduled_jobs()
            except Exception:  # noqa: BLE001 - la boucle ne doit jamais s'arrêter
                log.exception("worker.tick_failed")
            try:
                await asyncio.wait_for(stop.wait(), timeout=POLL_SECONDS)
            except TimeoutError:
                pass
    finally:
        # Arrêt propre (§12.3) : laisser au plus SHUTDOWN_GRACE_SECONDS aux opérations en cours.
        log.info("worker.stopping", worker_id=worker_id, grace_s=SHUTDOWN_GRACE_SECONDS)
        try:
            await asyncio.wait_for(_drain(), timeout=SHUTDOWN_GRACE_SECONDS)
        except (TimeoutError, Exception):  # noqa: BLE001
            log.warning("worker.drain_timeout")
        log.info("worker.stopped", worker_id=worker_id)
        await dispose_engine()


async def _drain() -> None:
    """Termine les envois encore en file avant l'arrêt définitif (§12.3)."""
    await send_due_emails()


if __name__ == "__main__":
    asyncio.run(run())
