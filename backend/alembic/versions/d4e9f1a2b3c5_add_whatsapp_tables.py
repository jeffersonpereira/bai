"""Add whatsapp_sessions and whatsapp_messages tables

Revision ID: d4e9f1a2b3c5
Revises: caea2bc6cf91
Create Date: 2026-04-20 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e9f1a2b3c5'
down_revision: Union[str, None] = 'caea2bc6cf91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'whatsapp_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('connected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_whatsapp_sessions_user_id_users'),
        sa.PrimaryKeyConstraint('id', name='pk_whatsapp_sessions'),
        sa.UniqueConstraint('user_id', name='uq_whatsapp_sessions_user_id'),
    )
    op.create_index('ix_whatsapp_sessions_id', 'whatsapp_sessions', ['id'])
    op.create_index('ix_whatsapp_sessions_user_id', 'whatsapp_sessions', ['user_id'])

    op.create_table(
        'whatsapp_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('chat_jid', sa.String(), nullable=False),
        sa.Column('message_id', sa.String(), nullable=True),
        sa.Column('direction', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_whatsapp_messages_user_id_users'),
        sa.PrimaryKeyConstraint('id', name='pk_whatsapp_messages'),
        sa.UniqueConstraint('message_id', name='uq_whatsapp_messages_message_id'),
    )
    op.create_index('ix_whatsapp_messages_id', 'whatsapp_messages', ['id'])
    op.create_index('ix_whatsapp_messages_user_id', 'whatsapp_messages', ['user_id'])
    op.create_index('ix_whatsapp_messages_chat_jid', 'whatsapp_messages', ['chat_jid'])


def downgrade() -> None:
    op.drop_index('ix_whatsapp_messages_chat_jid', table_name='whatsapp_messages')
    op.drop_index('ix_whatsapp_messages_user_id', table_name='whatsapp_messages')
    op.drop_index('ix_whatsapp_messages_id', table_name='whatsapp_messages')
    op.drop_table('whatsapp_messages')
    op.drop_index('ix_whatsapp_sessions_user_id', table_name='whatsapp_sessions')
    op.drop_index('ix_whatsapp_sessions_id', table_name='whatsapp_sessions')
    op.drop_table('whatsapp_sessions')
