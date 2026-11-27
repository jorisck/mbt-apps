"""Modèles SQLAlchemy (le schéma lui-même vit dans les migrations Alembic)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    ForeignKey,
    Integer,
    LargeBinary,
    SmallInteger,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT, INET, JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

TS = TIMESTAMP(timezone=True)


def new_id() -> uuid.UUID:
    """UUID v7 : ordonné dans le temps, impossible à énumérer (§4.1)."""
    return uuid.uuid7()


class Base(DeclarativeBase):
    pass


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(CITEXT, unique=True)
    full_name: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="invited")
    password_hash: Mapped[str | None] = mapped_column(Text)
    password_changed_at: Mapped[datetime | None] = mapped_column(TS)
    failed_logins: Mapped[int] = mapped_column(Integer, default=0)
    lockout_count: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(TS)
    last_login_at: Mapped[datetime | None] = mapped_column(TS)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"))
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class AdminSession(Base):
    __tablename__ = "admin_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admins.id", ondelete="CASCADE"))
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, unique=True)
    step_up_until: Mapped[datetime | None] = mapped_column(TS)
    csrf_token: Mapped[str] = mapped_column(Text)
    ip: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    last_seen_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    expires_at: Mapped[datetime] = mapped_column(TS)
    revoked_at: Mapped[datetime | None] = mapped_column(TS)


class AdminToken(Base):
    __tablename__ = "admin_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admins.id", ondelete="CASCADE"))
    purpose: Mapped[str] = mapped_column(Text)
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, unique=True)
    expires_at: Mapped[datetime] = mapped_column(TS)
    used_at: Mapped[datetime | None] = mapped_column(TS)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"))
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class Demande(Base):
    __tablename__ = "demandes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    reference: Mapped[str] = mapped_column(Text, unique=True)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(Text, default="received")
    origin: Mapped[str] = mapped_column(Text)
    service: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(Text)
    passenger_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    passenger_first_name: Mapped[str | None] = mapped_column(Text)
    passenger_last_name: Mapped[str | None] = mapped_column(Text)
    passenger_phone: Mapped[str | None] = mapped_column(Text)
    passenger_email: Mapped[str | None] = mapped_column(CITEXT)
    pickup_at: Mapped[datetime] = mapped_column(TS)
    pickup_address: Mapped[dict[str, Any]] = mapped_column(JSONB)
    pickup_instructions: Mapped[str | None] = mapped_column(Text)
    dropoff_address: Mapped[dict[str, Any]] = mapped_column(JSONB)
    return_at: Mapped[datetime | None] = mapped_column(TS)
    return_pickup_address: Mapped[dict[str, Any] | None] = mapped_column(JSONB(none_as_null=True))
    passenger_count: Mapped[int] = mapped_column(SmallInteger, default=1)
    needs: Mapped[dict[str, Any] | None] = mapped_column(JSONB(none_as_null=True))
    health_consent_at: Mapped[datetime | None] = mapped_column(TS)
    comment: Mapped[str | None] = mapped_column(Text)
    refusal_reason: Mapped[str | None] = mapped_column(Text)
    cancellation_reason: Mapped[str | None] = mapped_column(Text)
    cancelled_by: Mapped[str | None] = mapped_column(Text)
    closed_at: Mapped[datetime | None] = mapped_column(TS)
    closed_by: Mapped[str | None] = mapped_column(Text)
    stale_alerted_at: Mapped[datetime | None] = mapped_column(TS)
    assigned_admin_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"))
    idempotency_key: Mapped[str | None] = mapped_column(Text)
    request_fingerprint: Mapped[bytes | None] = mapped_column(LargeBinary)
    # Alimentée par le trigger `demandes_search` : jamais lue ni écrite par l'ORM, sauf recherche.
    search_text: Mapped[str | None] = mapped_column(Text, deferred=True)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    anonymized_at: Mapped[datetime | None] = mapped_column(TS)


class DemandeEvent(Base):
    __tablename__ = "demande_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    demande_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("demandes.id", ondelete="CASCADE"))
    revision: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(Text)
    from_status: Mapped[str | None] = mapped_column(Text)
    to_status: Mapped[str | None] = mapped_column(Text)
    actor_type: Mapped[str] = mapped_column(Text)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class DemandeNote(Base):
    __tablename__ = "demande_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    demande_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("demandes.id", ondelete="CASCADE"))
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admins.id"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = mapped_column(TS)


class EmailOutbox(Base):
    __tablename__ = "email_outbox"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    to_address: Mapped[str] = mapped_column(CITEXT)
    template: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(Text)
    context: Mapped[dict[str, Any] | None] = mapped_column(JSONB(none_as_null=True))
    demande_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("demandes.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(Text, default="pending")
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    lease_until: Mapped[datetime | None] = mapped_column(TS)
    provider_message_id: Mapped[str | None] = mapped_column(Text)
    last_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    sent_at: Mapped[datetime | None] = mapped_column(TS)


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(Text, primary_key=True)
    value: Mapped[Any] = mapped_column(JSONB)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"))
    updated_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    occurred_at: Mapped[datetime] = mapped_column(TS)
    actor_type: Mapped[str] = mapped_column(Text)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    action: Mapped[str] = mapped_column(Text)
    entity_type: Mapped[str | None] = mapped_column(Text)
    entity_id: Mapped[str | None] = mapped_column(Text)
    ip: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    prev_hash: Mapped[bytes | None] = mapped_column(LargeBinary)
    hash: Mapped[bytes] = mapped_column(LargeBinary)


class WorkerHeartbeat(Base):
    __tablename__ = "worker_heartbeats"

    worker_id: Mapped[str] = mapped_column(Text, primary_key=True)
    seen_at: Mapped[datetime] = mapped_column(TS)


class JobRun(Base):
    """Suivi des tâches planifiées : dernière exécution, statut, erreur (§12.2)."""

    __tablename__ = "job_runs"

    job: Mapped[str] = mapped_column(Text, primary_key=True)
    last_started_at: Mapped[datetime | None] = mapped_column(TS)
    last_finished_at: Mapped[datetime | None] = mapped_column(TS)
    last_status: Mapped[str | None] = mapped_column(Text)
    last_error: Mapped[str | None] = mapped_column(Text)
    items_processed: Mapped[int | None] = mapped_column(Integer)


class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="inactive")
    events: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    secret_enc: Mapped[bytes] = mapped_column(LargeBinary)
    secret_prev_enc: Mapped[bytes | None] = mapped_column(LargeBinary)
    secret_prev_expires_at: Mapped[datetime | None] = mapped_column(TS)
    custom_headers_enc: Mapped[bytes | None] = mapped_column(LargeBinary)
    include_health_data: Mapped[bool] = mapped_column(Boolean, default=False)
    last_test_at: Mapped[datetime | None] = mapped_column(TS)
    last_test_ok: Mapped[bool | None] = mapped_column(Boolean)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"))
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    endpoint_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("webhook_endpoints.id"))
    demande_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("demandes.id", ondelete="SET NULL"))
    event_type: Mapped[str] = mapped_column(Text)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(Text, default="pending")
    trigger: Mapped[str] = mapped_column(Text, default="auto")
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    lease_until: Mapped[datetime | None] = mapped_column(TS)
    last_error: Mapped[str | None] = mapped_column(Text)
    external_id: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class WebhookAttempt(Base):
    __tablename__ = "webhook_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    delivery_id: Mapped[str] = mapped_column(ForeignKey("webhook_deliveries.id"))
    trigger: Mapped[str] = mapped_column(Text, default="auto")
    triggered_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"))
    resolved_ip: Mapped[str | None] = mapped_column(INET)
    http_status: Mapped[int | None] = mapped_column(SmallInteger)
    error_type: Mapped[str | None] = mapped_column(Text)
    response_excerpt: Mapped[str | None] = mapped_column(Text)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


# -------------------------------------------------------------------------------------
# Lot L8 : comptes passagers (§18.3)
# -------------------------------------------------------------------------------------

class Passenger(Base):
    __tablename__ = "passengers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(CITEXT, unique=True)
    email_verified_at: Mapped[datetime | None] = mapped_column(TS)
    password_hash: Mapped[str] = mapped_column(Text)
    first_name: Mapped[str] = mapped_column(Text)
    last_name: Mapped[str] = mapped_column(Text)
    phone: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(Text, default="fr")
    default_needs: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True))
    health_consent_at: Mapped[datetime | None] = mapped_column(TS)
    status: Mapped[str] = mapped_column(Text, default="pending")
    last_login_at: Mapped[datetime | None] = mapped_column(TS)
    # Colonnes de verrouillage progressif (migration 0004)
    failed_logins: Mapped[int] = mapped_column(Integer, default=0)
    lockout_count: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(TS)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    anonymized_at: Mapped[datetime | None] = mapped_column(TS)


class PassengerAddress(Base):
    __tablename__ = "passenger_addresses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    passenger_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("passengers.id", ondelete="CASCADE"))
    label: Mapped[str] = mapped_column(Text)
    address: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class PassengerToken(Base):
    """Jetons à usage unique : vérification d'e-mail et réinitialisation de mot de passe (migration 0004)."""

    __tablename__ = "passenger_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    passenger_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("passengers.id", ondelete="CASCADE"))
    purpose: Mapped[str] = mapped_column(Text)  # email_verify | password_reset
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, unique=True)
    expires_at: Mapped[datetime] = mapped_column(TS)
    used_at: Mapped[datetime | None] = mapped_column(TS)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))


class PassengerRefreshToken(Base):
    """Jeton de rafraîchissement à rotation, avec détection de réutilisation (§18.3, migration 0004)."""

    __tablename__ = "passenger_refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    passenger_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("passengers.id", ondelete="CASCADE"))
    family_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, unique=True)
    client: Mapped[str] = mapped_column(Text)
    device_label: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TS, server_default=text("now()"))
    expires_at: Mapped[datetime] = mapped_column(TS)
    used_at: Mapped[datetime | None] = mapped_column(TS)
    revoked_at: Mapped[datetime | None] = mapped_column(TS)
