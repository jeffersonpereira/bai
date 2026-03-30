"""add atributos_extras, valor_aluguel, comissoes, property_views, feedback_visita, nivel_interesse

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-30

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- properties: novos campos ---
    op.add_column("properties", sa.Column("valor_aluguel", sa.Float(), nullable=True))
    op.add_column("properties", sa.Column("atributos_extras", sa.JSON(), nullable=True))
    op.add_column("properties", sa.Column("state", sa.String(), nullable=True))
    op.create_index("ix_properties_state", "properties", ["state"], unique=False)

    # --- appointments: feedback pós-visita ---
    op.add_column("appointments", sa.Column("feedback_visita", sa.Text(), nullable=True))

    # --- favorites: nível de interesse (1-5) ---
    op.add_column("favorites", sa.Column("nivel_interesse", sa.Integer(), nullable=True,
                                         server_default="3"))

    # --- property_views: imóveis vistos por compradores ---
    op.create_table(
        "property_views",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_property_views"),
        sa.UniqueConstraint("user_id", "property_id", name="uq_property_views_user_property"),
    )
    op.create_index("ix_property_views_id", "property_views", ["id"], unique=False)
    op.create_index("ix_property_views_user_id", "property_views", ["user_id"], unique=False)
    op.create_index("ix_property_views_property_id", "property_views", ["property_id"], unique=False)

    # --- comissoes: gestão de comissões (spec: gestao_comissoes) ---
    op.create_table(
        "comissoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proposal_id", sa.Integer(), sa.ForeignKey("proposals.id"), nullable=True),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("corretor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("agency_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("valor_imovel", sa.Float(), nullable=False),
        sa.Column("percentual", sa.Float(), nullable=False),
        sa.Column("valor_comissao", sa.Float(), nullable=False),
        sa.Column("status_pagamento", sa.String(), nullable=True),
        sa.Column("observacoes", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_comissoes"),
    )
    op.create_index("ix_comissoes_id", "comissoes", ["id"], unique=False)
    op.create_index("ix_comissoes_property_id", "comissoes", ["property_id"], unique=False)
    op.create_index("ix_comissoes_corretor_id", "comissoes", ["corretor_id"], unique=False)
    op.create_index("ix_comissoes_proposal_id", "comissoes", ["proposal_id"], unique=False)
    op.create_index("ix_comissoes_status_pagamento", "comissoes", ["status_pagamento"], unique=False)


def downgrade() -> None:
    op.drop_table("comissoes")
    op.drop_table("property_views")
    op.drop_column("favorites", "nivel_interesse")
    op.drop_column("appointments", "feedback_visita")
    op.drop_index("ix_properties_state", table_name="properties")
    op.drop_column("properties", "state")
    op.drop_column("properties", "atributos_extras")
    op.drop_column("properties", "valor_aluguel")
