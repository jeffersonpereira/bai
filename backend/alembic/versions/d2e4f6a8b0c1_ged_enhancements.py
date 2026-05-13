"""ged_enhancements

Revision ID: d2e4f6a8b0c1
Revises: c1f3a8b2d9e4
Create Date: 2026-04-29 10:00:00.000000

GED (Gestão Eletrônica de Documentos) - campos avançados:
- contexto: imovel | proprietario | operacional
- proprietario_id: vínculo direto ao proprietário
- validade_em: controle de vencimento
- hash_sha256: deduplicação de arquivos
- visibilidade: interno | compartilhado | publico
- assinado_digitalmente: flag de assinatura
- versao_numero + documento_origem_id: versionamento
- tags: JSON array de tags livres
"""
from alembic import op
import sqlalchemy as sa

revision = 'd2e4f6a8b0c1'
down_revision = 'b7e3f1a9c2d5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('documentos', sa.Column('contexto', sa.String(), nullable=True, server_default='operacional'))
    op.add_column('documentos', sa.Column('proprietario_id', sa.Integer(), nullable=True))
    op.add_column('documentos', sa.Column('validade_em', sa.DateTime(timezone=True), nullable=True))
    op.add_column('documentos', sa.Column('hash_sha256', sa.String(64), nullable=True))
    op.add_column('documentos', sa.Column('visibilidade', sa.String(), nullable=True, server_default='interno'))
    op.add_column('documentos', sa.Column('assinado_digitalmente', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('documentos', sa.Column('versao_numero', sa.Integer(), nullable=True, server_default='1'))
    op.add_column('documentos', sa.Column('documento_origem_id', sa.Integer(), nullable=True))
    op.add_column('documentos', sa.Column('tags', sa.JSON(), nullable=True))

    op.create_foreign_key(
        'fk_documentos_proprietario_id',
        'documentos', 'proprietarios',
        ['proprietario_id'], ['id'],
        ondelete='SET NULL',
    )
    op.create_foreign_key(
        'fk_documentos_origem_id',
        'documentos', 'documentos',
        ['documento_origem_id'], ['id'],
        ondelete='SET NULL',
    )

    op.create_index('ix_documentos_contexto', 'documentos', ['contexto'])
    op.create_index('ix_documentos_hash_sha256', 'documentos', ['hash_sha256'])
    op.create_index('ix_documentos_validade_em', 'documentos', ['validade_em'])

    # Normalizar tipos antigos que foram renomeados
    op.execute("UPDATE documentos SET tipo_documento = 'procuracao' WHERE tipo_documento = 'procuração'")


def downgrade() -> None:
    op.drop_index('ix_documentos_validade_em', table_name='documentos')
    op.drop_index('ix_documentos_hash_sha256', table_name='documentos')
    op.drop_index('ix_documentos_contexto', table_name='documentos')
    op.drop_constraint('fk_documentos_origem_id', 'documentos', type_='foreignkey')
    op.drop_constraint('fk_documentos_proprietario_id', 'documentos', type_='foreignkey')
    op.drop_column('documentos', 'tags')
    op.drop_column('documentos', 'documento_origem_id')
    op.drop_column('documentos', 'versao_numero')
    op.drop_column('documentos', 'assinado_digitalmente')
    op.drop_column('documentos', 'visibilidade')
    op.drop_column('documentos', 'hash_sha256')
    op.drop_column('documentos', 'validade_em')
    op.drop_column('documentos', 'proprietario_id')
    op.drop_column('documentos', 'contexto')
