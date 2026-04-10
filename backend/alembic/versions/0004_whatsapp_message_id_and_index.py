"""whatsapp_message_id_and_index

Revision ID: 0004
Revises: 88d887a83afb
Create Date: 2026-04-10

Adiciona:
- Coluna message_id (unique) em whatsapp_messages para deduplicação
- Índice composto (lead_id, timestamp) para consultas de histórico
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "88d887a83afb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "whatsapp_messages",
        sa.Column("message_id", sa.String(), nullable=True),
    )
    op.create_unique_constraint(
        "uq_whatsapp_messages_message_id",
        "whatsapp_messages",
        ["message_id"],
    )
    op.create_index(
        "ix_whatsapp_messages_lead_id_timestamp",
        "whatsapp_messages",
        ["lead_id", "timestamp"],
    )


def downgrade() -> None:
    op.drop_index("ix_whatsapp_messages_lead_id_timestamp", table_name="whatsapp_messages")
    op.drop_constraint("uq_whatsapp_messages_message_id", "whatsapp_messages", type_="unique")
    op.drop_column("whatsapp_messages", "message_id")
