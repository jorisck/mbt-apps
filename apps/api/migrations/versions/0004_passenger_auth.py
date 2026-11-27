"""Authentification des passagers : verrouillage, jetons à usage unique, rotation (lot L8, §18.3).

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-26
"""

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

# Chaque instruction est exécutée séparément : asyncpg refuse les requêtes multiples.
STATEMENTS = [
    # --- Colonnes de verrouillage sur les passagers (mêmes règles que les admins, §10.5) ---
    "ALTER TABLE passengers ADD COLUMN failed_logins int NOT NULL DEFAULT 0",
    "ALTER TABLE passengers ADD COLUMN lockout_count int NOT NULL DEFAULT 0",
    "ALTER TABLE passengers ADD COLUMN locked_until timestamptz",
    # --- Jetons à usage unique : vérification d'e-mail et réinitialisation de mot de passe --
    """
    CREATE TABLE passenger_tokens (
      id            uuid PRIMARY KEY,
      passenger_id  uuid NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
      purpose       text NOT NULL CHECK (purpose IN ('email_verify','password_reset')),
      token_hash    bytea NOT NULL UNIQUE,
      expires_at    timestamptz NOT NULL,
      used_at       timestamptz,
      created_at    timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX passenger_tokens_passenger ON passenger_tokens (passenger_id)",
    # --- Jetons de rafraîchissement à rotation (§18.3) ------------------------------------
    """
    CREATE TABLE passenger_refresh_tokens (
      id            uuid PRIMARY KEY,
      passenger_id  uuid NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
      family_id     uuid NOT NULL,
      token_hash    bytea NOT NULL UNIQUE,
      client        text NOT NULL CHECK (client IN ('site_mbt','site_handycab','app_ios','app_android')),
      device_label  text,
      created_at    timestamptz NOT NULL DEFAULT now(),
      expires_at    timestamptz NOT NULL,
      used_at       timestamptz,
      revoked_at    timestamptz
    )
    """,
    "CREATE INDEX refresh_tokens_family ON passenger_refresh_tokens (family_id)",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS passenger_refresh_tokens CASCADE")
    op.execute("DROP TABLE IF EXISTS passenger_tokens CASCADE")
    op.execute("ALTER TABLE passengers DROP COLUMN IF EXISTS failed_logins")
    op.execute("ALTER TABLE passengers DROP COLUMN IF EXISTS lockout_count")
    op.execute("ALTER TABLE passengers DROP COLUMN IF EXISTS locked_until")
