"""Add WhatsApp features tables: contacts, quick replies, tags, queues, schedules, campaigns, config

Revision ID: g7i9k1m3p5r8
Revises: f6h8j0l2n4p8
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa

revision = "g7i9k1m3p5r8"
down_revision = "f6h8j0l2n4p8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contatos_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("telefone", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=200), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_contatos_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_contatos_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_contatos_whatsapp_id", "contatos_whatsapp", ["id"])
    op.create_index("ix_contatos_whatsapp_usuario_id", "contatos_whatsapp", ["usuario_id"])

    op.create_table(
        "respostas_rapidas_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("atalho", sa.String(length=50), nullable=False),
        sa.Column("mensagem", sa.Text(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_respostas_rapidas_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_respostas_rapidas_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_respostas_rapidas_whatsapp_id", "respostas_rapidas_whatsapp", ["id"])
    op.create_index("ix_respostas_rapidas_whatsapp_usuario_id", "respostas_rapidas_whatsapp", ["usuario_id"])

    op.create_table(
        "tags_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("cor", sa.String(length=50), nullable=False, server_default="bg-emerald-500"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_tags_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_tags_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_tags_whatsapp_id", "tags_whatsapp", ["id"])
    op.create_index("ix_tags_whatsapp_usuario_id", "tags_whatsapp", ["usuario_id"])

    op.create_table(
        "tags_conversas_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("jid_conversa", sa.String(length=50), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_tags_conversas_whatsapp"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags_whatsapp.id"], name="fk_tags_conversas_whatsapp_tag_id_tags_whatsapp", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_tags_conversas_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_tags_conversas_whatsapp_id", "tags_conversas_whatsapp", ["id"])
    op.create_index("ix_tags_conversas_whatsapp_tag_id", "tags_conversas_whatsapp", ["tag_id"])
    op.create_index("ix_tags_conversas_whatsapp_usuario_id", "tags_conversas_whatsapp", ["usuario_id"])

    op.create_table(
        "filas_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("cor", sa.String(length=20), nullable=False, server_default="#10b981"),
        sa.Column("saudacao", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_filas_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_filas_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_filas_whatsapp_id", "filas_whatsapp", ["id"])
    op.create_index("ix_filas_whatsapp_usuario_id", "filas_whatsapp", ["usuario_id"])

    op.create_table(
        "agendamentos_mensagens_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("destinatario", sa.String(length=50), nullable=False),
        sa.Column("mensagem", sa.Text(), nullable=False),
        sa.Column("agendado_para", sa.DateTime(timezone=True), nullable=False),
        sa.Column("situacao", sa.String(length=20), nullable=False, server_default="pendente"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_agendamentos_mensagens_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_agendamentos_mensagens_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_agendamentos_mensagens_whatsapp_id", "agendamentos_mensagens_whatsapp", ["id"])
    op.create_index("ix_agendamentos_mensagens_whatsapp_usuario_id", "agendamentos_mensagens_whatsapp", ["usuario_id"])

    op.create_table(
        "campanhas_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("mensagem", sa.Text(), nullable=False),
        sa.Column("situacao", sa.String(length=20), nullable=False, server_default="rascunho"),
        sa.Column("total_envios", sa.Integer(), server_default="0"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_campanhas_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_campanhas_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_campanhas_whatsapp_id", "campanhas_whatsapp", ["id"])
    op.create_index("ix_campanhas_whatsapp_usuario_id", "campanhas_whatsapp", ["usuario_id"])

    op.create_table(
        "listas_contatos_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_listas_contatos_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_listas_contatos_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_listas_contatos_whatsapp_id", "listas_contatos_whatsapp", ["id"])
    op.create_index("ix_listas_contatos_whatsapp_usuario_id", "listas_contatos_whatsapp", ["usuario_id"])

    op.create_table(
        "itens_lista_contatos_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lista_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=True),
        sa.Column("telefone", sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_itens_lista_contatos_whatsapp"),
        sa.ForeignKeyConstraint(["lista_id"], ["listas_contatos_whatsapp.id"], name="fk_itens_lista_contatos_whatsapp_lista_id_listas_contatos_whatsapp", ondelete="CASCADE"),
    )
    op.create_index("ix_itens_lista_contatos_whatsapp_id", "itens_lista_contatos_whatsapp", ["id"])
    op.create_index("ix_itens_lista_contatos_whatsapp_lista_id", "itens_lista_contatos_whatsapp", ["lista_id"])

    op.create_table(
        "horarios_atendimento_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("dia_semana", sa.Integer(), nullable=False),
        sa.Column("inicio", sa.String(length=5), nullable=False, server_default="08:00"),
        sa.Column("fim", sa.String(length=5), nullable=False, server_default="18:00"),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id", name="pk_horarios_atendimento_whatsapp"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_horarios_atendimento_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_horarios_atendimento_whatsapp_id", "horarios_atendimento_whatsapp", ["id"])
    op.create_index("ix_horarios_atendimento_whatsapp_usuario_id", "horarios_atendimento_whatsapp", ["usuario_id"])

    op.create_table(
        "config_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("mensagem_fora_horario", sa.Text(), nullable=True),
        sa.Column("intervalo_campanha_seg", sa.Integer(), server_default="5"),
        sa.Column("variacao_campanha_seg", sa.Integer(), server_default="3"),
        sa.PrimaryKeyConstraint("id", name="pk_config_whatsapp"),
        sa.UniqueConstraint("usuario_id", name="uq_config_whatsapp_usuario_id"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name="fk_config_whatsapp_usuario_id_usuarios"),
    )
    op.create_index("ix_config_whatsapp_id", "config_whatsapp", ["id"])
    op.create_index("ix_config_whatsapp_usuario_id", "config_whatsapp", ["usuario_id"])


def downgrade() -> None:
    op.drop_table("config_whatsapp")
    op.drop_table("horarios_atendimento_whatsapp")
    op.drop_table("itens_lista_contatos_whatsapp")
    op.drop_table("listas_contatos_whatsapp")
    op.drop_table("campanhas_whatsapp")
    op.drop_table("agendamentos_mensagens_whatsapp")
    op.drop_table("filas_whatsapp")
    op.drop_table("tags_conversas_whatsapp")
    op.drop_table("tags_whatsapp")
    op.drop_table("respostas_rapidas_whatsapp")
    op.drop_table("contatos_whatsapp")
