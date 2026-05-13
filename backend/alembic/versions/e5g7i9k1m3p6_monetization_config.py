"""Add configuracoes_sistema table for payment gateway and system settings

Revision ID: e5g7i9k1m3p6
Revises: d2e4f6a8b0c1
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa

revision = "e5g7i9k1m3p6"
down_revision = "d2e4f6a8b0c1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "configuracoes_sistema",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("chave", sa.String(length=100), nullable=False),
        sa.Column("valor", sa.Text(), nullable=True),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("tipo", sa.String(length=20), nullable=True, server_default="string"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_configuracoes_sistema"),
        sa.UniqueConstraint("chave", name="uq_configuracoes_sistema_chave"),
    )
    op.create_index("ix_configuracoes_sistema_id", "configuracoes_sistema", ["id"])
    op.create_index("ix_configuracoes_sistema_chave", "configuracoes_sistema", ["chave"])


def downgrade() -> None:
    op.drop_index("ix_configuracoes_sistema_chave", table_name="configuracoes_sistema")
    op.drop_index("ix_configuracoes_sistema_id", table_name="configuracoes_sistema")
    op.drop_table("configuracoes_sistema")
