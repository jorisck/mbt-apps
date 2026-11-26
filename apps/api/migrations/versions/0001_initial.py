"""Schéma initial : admins, sessions, passagers, demandes, e-mails, paramètres, audit.

Sans double authentification dans cette version : pas de colonnes TOTP, pas de codes de secours,
pas de `mfa_verified`. Les tables webhooks arrivent avec le lot L4.

Revision ID: 0001
Revises:
Create Date: 2026-11-26
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

# Chaque instruction est exécutée séparément : asyncpg refuse les requêtes multiples.
STATEMENTS = [
    "CREATE EXTENSION IF NOT EXISTS citext",
    "CREATE EXTENSION IF NOT EXISTS pg_trgm",
    "CREATE EXTENSION IF NOT EXISTS unaccent",
    # --- Comptes admin -------------------------------------------------------------------
    """
    CREATE TABLE admins (
      id                   uuid PRIMARY KEY,
      email                citext NOT NULL UNIQUE,
      full_name            text   NOT NULL,
      status               text   NOT NULL DEFAULT 'invited'
                           CHECK (status IN ('invited','active','disabled')),
      password_hash        text,
      password_changed_at  timestamptz,
      failed_logins        int    NOT NULL DEFAULT 0,
      lockout_count        int    NOT NULL DEFAULT 0,
      locked_until         timestamptz,
      last_login_at        timestamptz,
      created_by           uuid REFERENCES admins(id),
      created_at           timestamptz NOT NULL DEFAULT now(),
      updated_at           timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE admin_sessions (
      id             uuid PRIMARY KEY,
      admin_id       uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      token_hash     bytea NOT NULL UNIQUE,
      step_up_until  timestamptz,
      csrf_token     text NOT NULL,
      ip             inet,
      user_agent     text,
      created_at     timestamptz NOT NULL DEFAULT now(),
      last_seen_at   timestamptz NOT NULL DEFAULT now(),
      expires_at     timestamptz NOT NULL,
      revoked_at     timestamptz
    )
    """,
    "CREATE INDEX admin_sessions_admin ON admin_sessions (admin_id) WHERE revoked_at IS NULL",
    """
    CREATE TABLE admin_tokens (
      id          uuid PRIMARY KEY,
      admin_id    uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      purpose     text NOT NULL CHECK (purpose IN ('invitation','password_reset')),
      token_hash  bytea NOT NULL UNIQUE,
      expires_at  timestamptz NOT NULL,
      used_at     timestamptz,
      created_by  uuid REFERENCES admins(id),
      created_at  timestamptz NOT NULL DEFAULT now()
    )
    """,
    # --- Passagers (compte client, livré avec le lot L8) ----------------------------------
    """
    CREATE TABLE passengers (
      id                 uuid PRIMARY KEY,
      email              citext NOT NULL UNIQUE,
      email_verified_at  timestamptz,
      password_hash      text NOT NULL,
      first_name         text NOT NULL,
      last_name          text NOT NULL,
      phone              text NOT NULL,
      language           text NOT NULL DEFAULT 'fr' CHECK (language IN ('fr','nl','en')),
      default_needs      jsonb,
      health_consent_at  timestamptz,
      status             text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','active','disabled','anonymized')),
      last_login_at      timestamptz,
      created_at         timestamptz NOT NULL DEFAULT now(),
      updated_at         timestamptz NOT NULL DEFAULT now(),
      anonymized_at      timestamptz,
      CHECK (default_needs IS NULL OR health_consent_at IS NOT NULL)
    )
    """,
    """
    CREATE TABLE passenger_addresses (
      id            uuid PRIMARY KEY,
      passenger_id  uuid NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
      label         text NOT NULL,
      address       jsonb NOT NULL,
      created_at    timestamptz NOT NULL DEFAULT now()
    )
    """,
    # --- Demandes ------------------------------------------------------------------------
    "CREATE SEQUENCE demande_number_seq",
    """
    CREATE TABLE demandes (
      id                     uuid PRIMARY KEY,
      reference              text NOT NULL UNIQUE,
      revision               int  NOT NULL DEFAULT 1,
      status                 text NOT NULL DEFAULT 'received'
                             CHECK (status IN ('received','confirmed','refused',
                                               'cancelled','completed','not_completed')),
      origin                 text NOT NULL
                             CHECK (origin IN ('site_mbt','site_handycab','app_ios','app_android')),
      service                text NOT NULL
                             CHECK (service IN ('business','daily','vsl','pmr')),
      language               text NOT NULL CHECK (language IN ('fr','nl','en')),
      passenger_id           uuid REFERENCES passengers(id),
      passenger_first_name   text,
      passenger_last_name    text,
      passenger_phone        text,
      passenger_email        citext,
      pickup_at              timestamptz NOT NULL,
      pickup_address         jsonb NOT NULL,
      pickup_instructions    text,
      dropoff_address        jsonb NOT NULL,
      return_at              timestamptz,
      return_pickup_address  jsonb,
      passenger_count        smallint NOT NULL DEFAULT 1 CHECK (passenger_count BETWEEN 1 AND 8),
      needs                  jsonb,
      health_consent_at      timestamptz,
      comment                text,
      refusal_reason         text,
      cancellation_reason    text,
      cancelled_by           text CHECK (cancelled_by IN ('passenger','admin')),
      closed_at              timestamptz,
      closed_by              text CHECK (closed_by IN ('admin','passenger','system')),
      assigned_admin_id      uuid REFERENCES admins(id),
      idempotency_key        text,
      request_fingerprint    bytea,
      search_text            text,
      created_at             timestamptz NOT NULL DEFAULT now(),
      updated_at             timestamptz NOT NULL DEFAULT now(),
      anonymized_at          timestamptz,
      CHECK (return_at IS NULL OR return_at > pickup_at),
      CHECK (needs IS NULL OR health_consent_at IS NOT NULL)
    )
    """,
    """CREATE UNIQUE INDEX demandes_idempotency ON demandes (idempotency_key)
       WHERE idempotency_key IS NOT NULL""",
    "CREATE INDEX demandes_status_pickup ON demandes (status, pickup_at)",
    "CREATE INDEX demandes_created ON demandes (created_at DESC)",
    "CREATE INDEX demandes_passenger ON demandes (passenger_id, pickup_at DESC)",
    "CREATE INDEX demandes_search_idx ON demandes USING gin (search_text gin_trgm_ops)",
    """
    CREATE FUNCTION demandes_search_text() RETURNS trigger AS $$
    BEGIN
      NEW.search_text := lower(unaccent(concat_ws(' ',
        NEW.reference,
        NEW.passenger_first_name, NEW.passenger_last_name, NEW.passenger_email,
        regexp_replace(coalesce(NEW.passenger_phone, ''), '\\D', '', 'g'),
        NEW.pickup_address->>'formatted', NEW.dropoff_address->>'formatted')));
      RETURN NEW;
    END $$ LANGUAGE plpgsql
    """,
    """
    CREATE TRIGGER demandes_search BEFORE INSERT OR UPDATE ON demandes
      FOR EACH ROW EXECUTE FUNCTION demandes_search_text()
    """,
    """
    CREATE TABLE demande_events (
      id           bigserial PRIMARY KEY,
      demande_id   uuid NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
      revision     int  NOT NULL,
      type         text NOT NULL,
      from_status  text,
      to_status    text,
      actor_type   text NOT NULL CHECK (actor_type IN ('admin','passenger','guest','system')),
      actor_id     uuid,
      reason       text,
      created_at   timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX demande_events_demande ON demande_events (demande_id, id)",
    """
    CREATE TABLE demande_notes (
      id          uuid PRIMARY KEY,
      demande_id  uuid NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
      admin_id    uuid NOT NULL REFERENCES admins(id),
      body        text NOT NULL CHECK (length(body) <= 2000),
      created_at  timestamptz NOT NULL DEFAULT now(),
      deleted_at  timestamptz
    )
    """,
    # --- E-mails, paramètres, audit, tables techniques -----------------------------------
    """
    CREATE TABLE email_outbox (
      id                   uuid PRIMARY KEY,
      to_address           citext NOT NULL,
      template             text NOT NULL,
      language             text NOT NULL,
      context              jsonb,
      demande_id           uuid REFERENCES demandes(id) ON DELETE SET NULL,
      status               text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','sending','sent','failed')),
      attempt_count        int NOT NULL DEFAULT 0,
      next_attempt_at      timestamptz NOT NULL DEFAULT now(),
      lease_until          timestamptz,
      provider_message_id  text,
      last_error           text,
      created_at           timestamptz NOT NULL DEFAULT now(),
      sent_at              timestamptz
    )
    """,
    "CREATE INDEX email_due ON email_outbox (next_attempt_at) WHERE status = 'pending'",
    """
    CREATE TABLE settings (
      key         text PRIMARY KEY,
      value       jsonb NOT NULL,
      updated_by  uuid REFERENCES admins(id),
      updated_at  timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE audit_log (
      id           bigserial PRIMARY KEY,
      occurred_at  timestamptz NOT NULL DEFAULT now(),
      actor_type   text NOT NULL CHECK (actor_type IN ('admin','passenger','system','anonymous')),
      actor_id     uuid,
      action       text NOT NULL,
      entity_type  text,
      entity_id    text,
      ip           inet,
      user_agent   text,
      details      jsonb NOT NULL DEFAULT '{}',
      prev_hash    bytea,
      hash         bytea NOT NULL
    )
    """,
    "CREATE INDEX audit_occurred ON audit_log (occurred_at DESC)",
    "CREATE INDEX audit_entity ON audit_log (entity_type, entity_id)",
    """
    CREATE FUNCTION audit_log_guard() RETURNS trigger AS $$
    BEGIN
      IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'audit_log : modification interdite';
      END IF;
      IF coalesce(current_setting('app.audit_purge', true), '') <> 'on' THEN
        RAISE EXCEPTION 'audit_log : suppression réservée à la purge planifiée';
      END IF;
      RETURN OLD;
    END $$ LANGUAGE plpgsql
    """,
    """
    CREATE TRIGGER audit_log_guard BEFORE UPDATE OR DELETE ON audit_log
      FOR EACH ROW EXECUTE FUNCTION audit_log_guard()
    """,
    """
    CREATE TABLE job_runs (
      job               text PRIMARY KEY,
      last_started_at   timestamptz,
      last_finished_at  timestamptz,
      last_status       text,
      last_error        text,
      items_processed   int
    )
    """,
    """
    CREATE TABLE worker_heartbeats (
      worker_id  text PRIMARY KEY,
      seen_at    timestamptz NOT NULL
    )
    """,
    """
    CREATE TABLE rate_limits (
      bucket        text NOT NULL,
      window_start  timestamptz NOT NULL,
      hits          int NOT NULL,
      PRIMARY KEY (bucket, window_start)
    )
    """,
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    for table in (
        "rate_limits",
        "worker_heartbeats",
        "job_runs",
        "audit_log",
        "settings",
        "email_outbox",
        "demande_notes",
        "demande_events",
        "demandes",
        "passenger_addresses",
        "passengers",
        "admin_tokens",
        "admin_sessions",
        "admins",
    ):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
    op.execute("DROP SEQUENCE IF EXISTS demande_number_seq")
    op.execute("DROP FUNCTION IF EXISTS demandes_search_text()")
    op.execute("DROP FUNCTION IF EXISTS audit_log_guard()")
