"""add fk indexes for performance

Revision ID: a4f2e8c1d7b3
Revises: c1f3a8b2d9e4
Create Date: 2026-04-27 00:00:00.000000

"""
from alembic import op

revision = 'a4f2e8c1d7b3'
down_revision = 'c1f3a8b2d9e4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('ix_leads_imovel_id', 'leads', ['imovel_id'], unique=False)
    op.create_index('ix_leads_corretor_id', 'leads', ['corretor_id'], unique=False)
    op.create_index('ix_agendamentos_imovel_id', 'agendamentos', ['imovel_id'], unique=False)
    op.create_index('ix_agendamentos_corretor_id', 'agendamentos', ['corretor_id'], unique=False)
    op.create_index('ix_agendamentos_comprador_id', 'agendamentos', ['comprador_id'], unique=False)
    op.create_index('ix_favoritos_usuario_id', 'favoritos', ['usuario_id'], unique=False)
    op.create_index('ix_favoritos_imovel_id', 'favoritos', ['imovel_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_leads_imovel_id', table_name='leads')
    op.drop_index('ix_leads_corretor_id', table_name='leads')
    op.drop_index('ix_agendamentos_imovel_id', table_name='agendamentos')
    op.drop_index('ix_agendamentos_corretor_id', table_name='agendamentos')
    op.drop_index('ix_agendamentos_comprador_id', table_name='agendamentos')
    op.drop_index('ix_favoritos_usuario_id', table_name='favoritos')
    op.drop_index('ix_favoritos_imovel_id', table_name='favoritos')
