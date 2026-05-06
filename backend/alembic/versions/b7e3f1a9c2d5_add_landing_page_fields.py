"""add landing page fields to usuarios

Revision ID: b7e3f1a9c2d5
Revises: a4f2e8c1d7b3
Create Date: 2026-04-29 00:00:00.000000

Adiciona campos de landing page personalizada para corretores e imobiliárias:
- slug: identificador único amigável para URL (/corretor/<slug>)
- bio: texto de apresentação público
- foto_perfil_url: foto ou logo do anunciante
- cor_primaria / cor_secundaria: identidade visual da landing page
- redes_sociais: JSON com links de Instagram, site, etc.
- landing_ativa: toggle para ativar/desativar a landing page
"""
from alembic import op
import sqlalchemy as sa

revision = 'b7e3f1a9c2d5'
down_revision = 'a4f2e8c1d7b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('slug', sa.String(100), nullable=True))
    op.add_column('usuarios', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('usuarios', sa.Column('foto_perfil_url', sa.String(500), nullable=True))
    op.add_column('usuarios', sa.Column('cor_primaria', sa.String(7), nullable=True, server_default='#1d4ed8'))
    op.add_column('usuarios', sa.Column('cor_secundaria', sa.String(7), nullable=True, server_default='#1e293b'))
    op.add_column('usuarios', sa.Column('redes_sociais', sa.JSON(), nullable=True))
    op.add_column('usuarios', sa.Column('landing_ativa', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    op.create_index('ix_usuarios_slug', 'usuarios', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_usuarios_slug', table_name='usuarios')
    op.drop_column('usuarios', 'landing_ativa')
    op.drop_column('usuarios', 'redes_sociais')
    op.drop_column('usuarios', 'cor_secundaria')
    op.drop_column('usuarios', 'cor_primaria')
    op.drop_column('usuarios', 'foto_perfil_url')
    op.drop_column('usuarios', 'bio')
    op.drop_column('usuarios', 'slug')
