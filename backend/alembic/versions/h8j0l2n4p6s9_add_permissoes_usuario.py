"""add permissoes to usuario

Revision ID: h8j0l2n4p6s9
Revises: g7i9k1m3p5r8
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa

revision = "h8j0l2n4p6s9"
down_revision = "g7i9k1m3p5r8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "usuarios",
        sa.Column("permissoes", sa.JSON(), nullable=True),
    )


def downgrade():
    op.drop_column("usuarios", "permissoes")
