"""Add pagamentos table for subscription transaction history

Revision ID: f6h8j0l2n4p8
Revises: e5g7i9k1m3p6
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa

revision = "f6h8j0l2n4p8"
down_revision = "e5g7i9k1m3p6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pagamentos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("gateway", sa.String(length=50), nullable=False),
        sa.Column("valor_centavos", sa.Integer(), nullable=False),
        sa.Column("moeda", sa.String(length=3), server_default="BRL"),
        sa.Column("status", sa.String(length=30), server_default="pendente"),
        sa.Column("plano_contratado", sa.String(length=20), nullable=False),
        sa.Column("ciclo", sa.String(length=10), nullable=False),
        sa.Column("referencia_externa", sa.String(length=255), nullable=True),
        sa.Column("customer_id_externo", sa.String(length=255), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_pagamentos"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_pagamentos_usuario_id_usuarios"),
    )
    op.create_index("ix_pagamentos_id", "pagamentos", ["id"])
    op.create_index("ix_pagamentos_usuario_id", "pagamentos", ["usuario_id"])
    op.create_index("ix_pagamentos_status", "pagamentos", ["status"])
    op.create_index("ix_pagamentos_referencia_externa", "pagamentos", ["referencia_externa"])


def downgrade() -> None:
    op.drop_index("ix_pagamentos_referencia_externa", table_name="pagamentos")
    op.drop_index("ix_pagamentos_status", table_name="pagamentos")
    op.drop_index("ix_pagamentos_usuario_id", table_name="pagamentos")
    op.drop_index("ix_pagamentos_id", table_name="pagamentos")
    op.drop_table("pagamentos")
