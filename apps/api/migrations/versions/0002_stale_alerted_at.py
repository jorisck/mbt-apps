"""Ajoute demandes.stale_alerted_at pour l'alerte demande non traitée (§12.1).

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-26
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

STATEMENTS = [
    "ALTER TABLE demandes ADD COLUMN stale_alerted_at timestamptz",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    op.execute("ALTER TABLE demandes DROP COLUMN IF EXISTS stale_alerted_at")
