"""Webhooks (lot L4) : webhook_endpoints, webhook_deliveries, webhook_attempts.

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-26
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

# Chaque instruction est exécutée séparément : asyncpg refuse les requêtes multiples.
STATEMENTS = [
    """
    CREATE TABLE webhook_endpoints (
      id                     uuid PRIMARY KEY,
      name                   text NOT NULL,
      url                    text NOT NULL,
      status                 text NOT NULL DEFAULT 'inactive'
                             CHECK (status IN ('inactive','active','archived')),
      events                 text[] NOT NULL DEFAULT '{}',
      secret_enc             bytea NOT NULL,
      secret_prev_enc        bytea,
      secret_prev_expires_at timestamptz,
      custom_headers_enc     bytea,
      include_health_data    boolean NOT NULL DEFAULT false,
      last_test_at           timestamptz,
      last_test_ok           boolean,
      created_by             uuid REFERENCES admins(id),
      created_at             timestamptz NOT NULL DEFAULT now(),
      updated_at             timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX webhook_endpoints_status ON webhook_endpoints (status) WHERE status = 'active'",
    """
    CREATE TABLE webhook_deliveries (
      id               text PRIMARY KEY,
      endpoint_id      uuid NOT NULL REFERENCES webhook_endpoints(id),
      demande_id       uuid REFERENCES demandes(id) ON DELETE SET NULL,
      event_type       text NOT NULL,
      payload          jsonb NOT NULL,
      status           text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','sending','succeeded','failed','abandoned')),
      trigger          text NOT NULL DEFAULT 'auto'
                       CHECK (trigger IN ('auto','test','manual')),
      attempt_count    int NOT NULL DEFAULT 0,
      next_attempt_at  timestamptz NOT NULL DEFAULT now(),
      lease_until      timestamptz,
      last_error       text,
      external_id      text,
      created_at       timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX webhook_deliveries_due ON webhook_deliveries (next_attempt_at) WHERE status = 'pending'",
    "CREATE INDEX webhook_deliveries_endpoint ON webhook_deliveries (endpoint_id, created_at DESC)",
    "CREATE INDEX webhook_deliveries_demande ON webhook_deliveries (demande_id) WHERE demande_id IS NOT NULL",
    """
    CREATE TABLE webhook_attempts (
      id              bigserial PRIMARY KEY,
      delivery_id     text NOT NULL REFERENCES webhook_deliveries(id),
      trigger         text NOT NULL DEFAULT 'auto'
                      CHECK (trigger IN ('auto','test','manual')),
      triggered_by    uuid REFERENCES admins(id),
      resolved_ip     inet,
      http_status     smallint,
      error_type      text,
      response_excerpt text,
      duration_ms     int,
      created_at      timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX webhook_attempts_delivery ON webhook_attempts (delivery_id, id)",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    for table in ("webhook_attempts", "webhook_deliveries", "webhook_endpoints"):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
