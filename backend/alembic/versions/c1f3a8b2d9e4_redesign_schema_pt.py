"""redesign_schema_pt

Revision ID: c1f3a8b2d9e4
Revises: 09d1da6a1c6a
Create Date: 2026-04-20 22:30:00.000000

Redesenho completo do schema:
- Todos os nomes de tabelas e colunas em português
- Tipos monetários migrados de Float para NUMERIC
- Constraints de unicidade e integridade adicionadas
- Colunas atualizado_em adicionadas onde faltavam
- mandatos.data_vencimento com timezone
- midias_imovel.imovel_id NOT NULL + coluna ordem
- favoritos com UNIQUE(usuario_id, imovel_id)
- perfis_comprador com UNIQUE(usuario_id)
- disponibilidade_imovel com UNIQUE(imovel_id, dia_semana, hora_inicio) e CHECK(hora_inicio < hora_fim)
- Trigger PostGIS atualizado para nova tabela imoveis
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c1f3a8b2d9e4'
down_revision: Union[str, None] = '09d1da6a1c6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 0. Remover PostGIS da tabela antiga antes de dropar ───────────────────
    op.execute("DROP TRIGGER IF EXISTS trg_properties_sync_location ON properties")
    op.execute("DROP FUNCTION IF EXISTS trg_sync_location()")
    op.execute("DROP INDEX IF EXISTS ix_properties_location_gist")

    # ── 1. Dropar tabelas antigas (ordem reversa de dependência) ─────────────
    for tbl in [
        "lead_activities", "documents", "comissoes", "proposals",
        "property_views", "property_media", "property_availability",
        "property_assignments", "mandates", "favorites", "leads",
        "appointments", "buyer_profiles", "whatsapp_messages",
        "whatsapp_sessions", "properties", "owners", "users",
    ]:
        op.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE")

    # ── 2. Criar tabela usuarios ──────────────────────────────────────────────
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("senha_hash", sa.String(), nullable=False),
        sa.Column("nome", sa.String(), nullable=True),
        sa.Column("perfil", sa.String(), nullable=True),
        sa.Column("tipo_plano", sa.String(), nullable=True),
        sa.Column("plano_expira_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("telefone", sa.String(), nullable=True),
        sa.Column("creci", sa.String(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("imobiliaria_id", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["imobiliaria_id"], ["usuarios.id"],
                                name="fk_usuarios_imobiliaria_id"),
        sa.PrimaryKeyConstraint("id", name="pk_usuarios"),
        sa.CheckConstraint(
            "perfil IN ('comprador','corretor','imobiliaria','admin')",
            name="ck_usuarios_perfil",
        ),
        sa.CheckConstraint(
            "tipo_plano IN ('gratuito','pro','premium')",
            name="ck_usuarios_tipo_plano",
        ),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"], unique=True)
    op.create_index("ix_usuarios_id", "usuarios", ["id"])
    op.create_index("ix_usuarios_perfil", "usuarios", ["perfil"])
    op.create_index("ix_usuarios_tipo_plano", "usuarios", ["tipo_plano"])

    # ── 3. Criar tabela proprietarios ─────────────────────────────────────────
    op.create_table(
        "proprietarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("telefone", sa.String(), nullable=True),
        sa.Column("documento", sa.String(), nullable=True),
        sa.Column("endereco", sa.String(), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("corretor_id", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["corretor_id"], ["usuarios.id"],
                                name="fk_proprietarios_corretor_id"),
        sa.PrimaryKeyConstraint("id", name="pk_proprietarios"),
    )
    op.create_index("ix_proprietarios_id", "proprietarios", ["id"])
    op.create_index("ix_proprietarios_email", "proprietarios", ["email"])

    # ── 4. Criar tabela imoveis ───────────────────────────────────────────────
    op.create_table(
        "imoveis",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("preco", sa.Numeric(15, 2), nullable=False),
        sa.Column("valor_aluguel", sa.Numeric(15, 2), nullable=True),
        sa.Column("area", sa.Numeric(10, 2), nullable=True),
        sa.Column("quartos", sa.Integer(), nullable=True),
        sa.Column("banheiros", sa.Integer(), nullable=True),
        sa.Column("vagas", sa.Integer(), nullable=True),
        sa.Column("aceita_financiamento", sa.Boolean(), nullable=True),
        sa.Column("cidade", sa.String(), nullable=True),
        sa.Column("bairro", sa.String(), nullable=True),
        sa.Column("estado", sa.String(), nullable=True),
        sa.Column("endereco_completo", sa.String(), nullable=True),
        sa.Column("url_origem", sa.String(), nullable=True),
        sa.Column("url_imagem", sa.String(), nullable=True),
        sa.Column("origem", sa.String(), nullable=True),
        sa.Column("tipo_oferta", sa.String(), nullable=True),
        sa.Column("tipo_imovel", sa.String(), nullable=True),
        sa.Column("situacao", sa.String(), nullable=True),
        sa.Column("corretor_id", sa.Integer(), nullable=True),
        sa.Column("proprietario_id", sa.Integer(), nullable=True),
        sa.Column("percentual_comissao", sa.Numeric(5, 4), nullable=True),
        sa.Column("pontuacao_mercado", sa.Numeric(5, 2), nullable=True),
        sa.Column("atributos_extras", sa.JSON(), nullable=True),
        sa.Column("destaque", sa.Boolean(), nullable=True),
        sa.Column("ultima_analise_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_visualizacoes", sa.Integer(), server_default="0", nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.ForeignKeyConstraint(["corretor_id"], ["usuarios.id"],
                                name="fk_imoveis_corretor_id"),
        sa.ForeignKeyConstraint(["proprietario_id"], ["proprietarios.id"],
                                name="fk_imoveis_proprietario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_imoveis"),
        sa.UniqueConstraint("url_origem", name="uq_imoveis_url_origem"),
        sa.CheckConstraint(
            "tipo_oferta IN ('venda','aluguel','temporada','ambos')",
            name="ck_imoveis_tipo_oferta",
        ),
        sa.CheckConstraint(
            "tipo_imovel IN ('apartamento','casa','terreno','comercial','rural')",
            name="ck_imoveis_tipo_imovel",
        ),
        sa.CheckConstraint(
            "situacao IN ('ativo','arquivado','pendente','vendido','alugado')",
            name="ck_imoveis_situacao",
        ),
    )
    for col in ["id", "titulo", "preco", "area", "quartos", "cidade", "bairro",
                "estado", "tipo_oferta", "tipo_imovel", "situacao",
                "total_visualizacoes", "criado_em"]:
        op.create_index(f"ix_imoveis_{col}", "imoveis", [col],
                        unique=(col == "id") and False)

    # ── 5. PostGIS na tabela imoveis ──────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute(
        "ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS "
        "localizacao geometry(Point, 4326)"
    )
    op.execute("""
        CREATE OR REPLACE FUNCTION trg_sincronizar_localizacao()
        RETURNS trigger AS $$
        BEGIN
            IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
                NEW.localizacao := ST_SetSRID(
                    ST_MakePoint(NEW.longitude::float8, NEW.latitude::float8), 4326);
            ELSE
                NEW.localizacao := NULL;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("DROP TRIGGER IF EXISTS trg_imoveis_sincronizar_localizacao ON imoveis")
    op.execute("""
        CREATE TRIGGER trg_imoveis_sincronizar_localizacao
            BEFORE INSERT OR UPDATE OF latitude, longitude
            ON imoveis
            FOR EACH ROW
            EXECUTE FUNCTION trg_sincronizar_localizacao()
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_imoveis_localizacao_gist "
        "ON imoveis USING gist(localizacao)"
    )
    op.create_index("ix_imoveis_lat_lng", "imoveis", ["latitude", "longitude"])

    # ── 6. Criar tabela perfis_comprador ──────────────────────────────────────
    op.create_table(
        "perfis_comprador",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("nome_perfil", sa.String(), nullable=True),
        sa.Column("preco_minimo", sa.Numeric(15, 2), nullable=True),
        sa.Column("preco_maximo", sa.Numeric(15, 2), nullable=True),
        sa.Column("cidade", sa.String(), nullable=True),
        sa.Column("bairro", sa.String(), nullable=True),
        sa.Column("tipo_imovel", sa.String(), nullable=True),
        sa.Column("tipo_oferta", sa.String(), nullable=True),
        sa.Column("quartos_minimo", sa.Integer(), nullable=True),
        sa.Column("banheiros_minimo", sa.Integer(), nullable=True),
        sa.Column("vagas_minimo", sa.Integer(), nullable=True),
        sa.Column("financiamento_aprovado", sa.Boolean(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"],
                                name="fk_perfis_comprador_usuario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_perfis_comprador"),
        sa.UniqueConstraint("usuario_id", name="uq_perfis_comprador_usuario"),
    )
    op.create_index("ix_perfis_comprador_id", "perfis_comprador", ["id"])
    op.create_index("ix_perfis_comprador_usuario_id", "perfis_comprador", ["usuario_id"])

    # ── 7. Criar tabela sessoes_whatsapp ──────────────────────────────────────
    op.create_table(
        "sessoes_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("situacao", sa.String(), nullable=True),
        sa.Column("conectado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"],
                                name="fk_sessoes_whatsapp_usuario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_sessoes_whatsapp"),
    )
    op.create_index("ix_sessoes_whatsapp_id", "sessoes_whatsapp", ["id"])
    op.create_index("ix_sessoes_whatsapp_usuario_id", "sessoes_whatsapp",
                    ["usuario_id"], unique=True)

    # ── 8. Criar tabela mensagens_whatsapp ────────────────────────────────────
    op.create_table(
        "mensagens_whatsapp",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("jid_conversa", sa.String(), nullable=False),
        sa.Column("id_mensagem", sa.String(), nullable=True),
        sa.Column("direcao", sa.String(), nullable=False),
        sa.Column("conteudo", sa.Text(), nullable=False),
        sa.Column("enviado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"],
                                name="fk_mensagens_whatsapp_usuario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_mensagens_whatsapp"),
        sa.UniqueConstraint("id_mensagem", name="uq_mensagens_whatsapp_id_mensagem"),
    )
    op.create_index("ix_mensagens_whatsapp_id", "mensagens_whatsapp", ["id"])
    op.create_index("ix_mensagens_whatsapp_usuario_id", "mensagens_whatsapp", ["usuario_id"])
    op.create_index("ix_mensagens_whatsapp_jid_conversa", "mensagens_whatsapp", ["jid_conversa"])

    # ── 9. Criar tabela mandatos ──────────────────────────────────────────────
    op.create_table(
        "mandatos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=True),
        sa.Column("proprietario_id", sa.Integer(), nullable=True),
        sa.Column("corretor_id", sa.Integer(), nullable=True),
        sa.Column("tipo", sa.String(), nullable=True),
        sa.Column("percentual_comissao", sa.Numeric(5, 4), nullable=True),
        sa.Column("exclusivo", sa.Boolean(), nullable=True),
        sa.Column("data_vencimento", sa.DateTime(timezone=True), nullable=True),
        sa.Column("situacao", sa.String(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["corretor_id"], ["usuarios.id"],
                                name="fk_mandatos_corretor_id"),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_mandatos_imovel_id"),
        sa.ForeignKeyConstraint(["proprietario_id"], ["proprietarios.id"],
                                name="fk_mandatos_proprietario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_mandatos"),
        sa.CheckConstraint("tipo IN ('venda','locacao')", name="ck_mandatos_tipo"),
        sa.CheckConstraint(
            "situacao IN ('ativo','expirado','rescindido')", name="ck_mandatos_situacao"
        ),
    )
    op.create_index("ix_mandatos_id", "mandatos", ["id"])
    # Índice parcial garante apenas um mandato ATIVO por imóvel
    op.execute(
        "CREATE UNIQUE INDEX ix_mandatos_imovel_ativo "
        "ON mandatos (imovel_id) WHERE situacao = 'ativo'"
    )

    # ── 10. Criar tabela responsaveis_imovel ──────────────────────────────────
    op.create_table(
        "responsaveis_imovel",
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("funcao", sa.String(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_responsaveis_imovel_imovel_id"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"],
                                name="fk_responsaveis_imovel_usuario_id"),
        sa.PrimaryKeyConstraint("imovel_id", "usuario_id", name="pk_responsaveis_imovel"),
    )

    # ── 11. Criar tabela disponibilidade_imovel ───────────────────────────────
    op.create_table(
        "disponibilidade_imovel",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("dia_semana", sa.Integer(), nullable=True),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("hora_fim", sa.Time(), nullable=False),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_disponibilidade_imovel_imovel_id"),
        sa.PrimaryKeyConstraint("id", name="pk_disponibilidade_imovel"),
        sa.UniqueConstraint("imovel_id", "dia_semana", "hora_inicio",
                            name="uq_disponibilidade_imovel_slot"),
        sa.CheckConstraint("hora_inicio < hora_fim",
                           name="ck_disponibilidade_horario_valido"),
    )
    op.create_index("ix_disponibilidade_imovel_id", "disponibilidade_imovel", ["id"])

    # ── 12. Criar tabela midias_imovel ────────────────────────────────────────
    op.create_table(
        "midias_imovel",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("tipo_midia", sa.String(), nullable=True),
        sa.Column("url", sa.String(), nullable=True),
        sa.Column("ordem", sa.Integer(), server_default="0", nullable=True),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_midias_imovel_imovel_id"),
        sa.PrimaryKeyConstraint("id", name="pk_midias_imovel"),
        sa.CheckConstraint(
            "tipo_midia IN ('imagem','video','tour_virtual')",
            name="ck_midias_imovel_tipo_midia",
        ),
    )
    op.create_index("ix_midias_imovel_id", "midias_imovel", ["id"])

    # ── 13. Criar tabela visualizacoes_imovel ─────────────────────────────────
    op.create_table(
        "visualizacoes_imovel",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("visualizado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_visualizacoes_imovel_imovel_id"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"],
                                name="fk_visualizacoes_imovel_usuario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_visualizacoes_imovel"),
        sa.UniqueConstraint("usuario_id", "imovel_id",
                            name="uq_visualizacoes_usuario_imovel"),
    )
    op.create_index("ix_visualizacoes_imovel_id", "visualizacoes_imovel", ["id"])
    op.create_index("ix_visualizacoes_imovel_usuario_id", "visualizacoes_imovel", ["usuario_id"])
    op.create_index("ix_visualizacoes_imovel_imovel_id", "visualizacoes_imovel", ["imovel_id"])

    # ── 14. Criar tabela favoritos ────────────────────────────────────────────
    op.create_table(
        "favoritos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("nivel_interesse", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_favoritos_imovel_id"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"],
                                name="fk_favoritos_usuario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_favoritos"),
        sa.UniqueConstraint("usuario_id", "imovel_id",
                            name="uq_favoritos_usuario_imovel"),
        sa.CheckConstraint("nivel_interesse BETWEEN 1 AND 5",
                           name="ck_favoritos_nivel_interesse"),
    )
    op.create_index("ix_favoritos_id", "favoritos", ["id"])

    # ── 15. Criar tabela leads ────────────────────────────────────────────────
    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=True),
        sa.Column("corretor_id", sa.Integer(), nullable=True),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("telefone", sa.String(), nullable=True),
        sa.Column("origem", sa.String(), nullable=True),
        sa.Column("situacao", sa.String(), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["corretor_id"], ["usuarios.id"],
                                name="fk_leads_corretor_id"),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_leads_imovel_id"),
        sa.PrimaryKeyConstraint("id", name="pk_leads"),
        sa.CheckConstraint(
            "situacao IN ('novo','contatado','visita','proposta','fechado','perdido')",
            name="ck_leads_situacao",
        ),
    )
    op.create_index("ix_leads_id", "leads", ["id"])

    # ── 16. Criar tabela atividades_lead ──────────────────────────────────────
    op.create_table(
        "atividades_lead",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lead_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("tipo_atividade", sa.String(), nullable=True),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"],
                                name="fk_atividades_lead_lead_id"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"],
                                name="fk_atividades_lead_usuario_id"),
        sa.PrimaryKeyConstraint("id", name="pk_atividades_lead"),
    )
    op.create_index("ix_atividades_lead_id", "atividades_lead", ["id"])

    # ── 17. Criar tabela agendamentos ─────────────────────────────────────────
    op.create_table(
        "agendamentos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("corretor_id", sa.Integer(), nullable=True),
        sa.Column("comprador_id", sa.Integer(), nullable=True),
        sa.Column("nome_visitante", sa.String(), nullable=False),
        sa.Column("telefone_visitante", sa.String(), nullable=False),
        sa.Column("data_visita", sa.DateTime(timezone=True), nullable=False),
        sa.Column("data_fim_visita", sa.DateTime(timezone=True), nullable=True),
        sa.Column("situacao", sa.String(), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("feedback_visita", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["comprador_id"], ["usuarios.id"],
                                name="fk_agendamentos_comprador_id"),
        sa.ForeignKeyConstraint(["corretor_id"], ["usuarios.id"],
                                name="fk_agendamentos_corretor_id"),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_agendamentos_imovel_id"),
        sa.PrimaryKeyConstraint("id", name="pk_agendamentos"),
        sa.CheckConstraint(
            "situacao IN ('pendente','confirmado','cancelado','realizado')",
            name="ck_agendamentos_situacao",
        ),
        sa.CheckConstraint(
            "data_fim_visita IS NULL OR data_fim_visita > data_visita",
            name="ck_agendamentos_horario_valido",
        ),
    )
    op.create_index("ix_agendamentos_id", "agendamentos", ["id"])

    # ── 18. Criar tabela propostas ────────────────────────────────────────────
    op.create_table(
        "propostas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("comprador_id", sa.Integer(), nullable=True),
        sa.Column("nome_comprador", sa.String(), nullable=False),
        sa.Column("email_comprador", sa.String(), nullable=True),
        sa.Column("telefone_comprador", sa.String(), nullable=True),
        sa.Column("valor_ofertado", sa.Numeric(15, 2), nullable=False),
        sa.Column("forma_pagamento", sa.String(), nullable=True),
        sa.Column("percentual_financiamento", sa.Numeric(5, 2), nullable=True),
        sa.Column("condicoes", sa.String(), nullable=True),
        sa.Column("mensagem", sa.String(), nullable=True),
        sa.Column("situacao", sa.String(), nullable=True),
        sa.Column("corretor_id", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["comprador_id"], ["usuarios.id"],
                                name="fk_propostas_comprador_id"),
        sa.ForeignKeyConstraint(["corretor_id"], ["usuarios.id"],
                                name="fk_propostas_corretor_id"),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_propostas_imovel_id"),
        sa.PrimaryKeyConstraint("id", name="pk_propostas"),
        sa.CheckConstraint(
            "situacao IN ('pendente','visualizada','encaminhada','aceita','recusada','contraproposta')",
            name="ck_propostas_situacao",
        ),
        sa.CheckConstraint(
            "forma_pagamento IN ('avista','financiamento','misto')",
            name="ck_propostas_forma_pagamento",
        ),
    )
    for col in ["id", "imovel_id", "comprador_id", "situacao"]:
        op.create_index(f"ix_propostas_{col}", "propostas", [col])

    # ── 19. Criar tabela comissoes ────────────────────────────────────────────
    op.create_table(
        "comissoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proposta_id", sa.Integer(), nullable=True),
        sa.Column("imovel_id", sa.Integer(), nullable=False),
        sa.Column("corretor_id", sa.Integer(), nullable=False),
        sa.Column("imobiliaria_id", sa.Integer(), nullable=True),
        sa.Column("valor_imovel", sa.Numeric(15, 2), nullable=False),
        sa.Column("percentual", sa.Numeric(5, 4), nullable=False),
        sa.Column("valor_comissao", sa.Numeric(15, 2), nullable=False),
        sa.Column("situacao_pagamento", sa.String(), nullable=True),
        sa.Column("observacoes", sa.String(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pago_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["corretor_id"], ["usuarios.id"],
                                name="fk_comissoes_corretor_id"),
        sa.ForeignKeyConstraint(["imobiliaria_id"], ["usuarios.id"],
                                name="fk_comissoes_imobiliaria_id"),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_comissoes_imovel_id"),
        sa.ForeignKeyConstraint(["proposta_id"], ["propostas.id"],
                                name="fk_comissoes_proposta_id"),
        sa.PrimaryKeyConstraint("id", name="pk_comissoes"),
        sa.CheckConstraint(
            "situacao_pagamento IN ('pendente','pago','cancelado')",
            name="ck_comissoes_situacao_pagamento",
        ),
    )
    for col in ["id", "imovel_id", "corretor_id", "proposta_id", "situacao_pagamento"]:
        op.create_index(f"ix_comissoes_{col}", "comissoes", [col])

    # ── 20. Criar tabela documentos ───────────────────────────────────────────
    op.create_table(
        "documentos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(), nullable=False),
        sa.Column("tipo_documento", sa.String(), nullable=False),
        sa.Column("descricao", sa.String(), nullable=True),
        sa.Column("nome_arquivo", sa.String(), nullable=True),
        sa.Column("url_arquivo", sa.String(), nullable=True),
        sa.Column("tamanho_bytes", sa.BigInteger(), nullable=True),
        sa.Column("situacao", sa.String(), nullable=True),
        sa.Column("enviado_por", sa.Integer(), nullable=False),
        sa.Column("imovel_id", sa.Integer(), nullable=True),
        sa.Column("proposta_id", sa.Integer(), nullable=True),
        sa.Column("observacoes", sa.String(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["enviado_por"], ["usuarios.id"],
                                name="fk_documentos_enviado_por"),
        sa.ForeignKeyConstraint(["imovel_id"], ["imoveis.id"],
                                name="fk_documentos_imovel_id"),
        sa.ForeignKeyConstraint(["proposta_id"], ["propostas.id"],
                                name="fk_documentos_proposta_id"),
        sa.PrimaryKeyConstraint("id", name="pk_documentos"),
        sa.CheckConstraint(
            "situacao IN ('rascunho','pendente_assinatura','assinado','arquivado')",
            name="ck_documentos_situacao",
        ),
    )
    for col in ["id", "tipo_documento", "imovel_id", "proposta_id", "situacao", "enviado_por"]:
        op.create_index(f"ix_documentos_{col}", "documentos", [col])

    # ── 21. Re-seed dos imóveis de demonstração ───────────────────────────────
    op.execute("""
        INSERT INTO imoveis (
            titulo, descricao, preco, area, quartos, banheiros, vagas,
            aceita_financiamento, cidade, bairro, estado, endereco_completo,
            url_origem, origem, tipo_oferta, tipo_imovel, situacao,
            pontuacao_mercado, latitude, longitude
        ) VALUES
        ('Apartamento moderno em Pinheiros', 'Amplo 2 quartos próximo ao metrô, varanda gourmet.', 650000, 75, 2, 2, 1, true, 'São Paulo', 'Pinheiros', 'SP', 'Rua dos Pinheiros, 500, Pinheiros, SP', 'seed://sp-pinheiros-001', 'seed', 'venda', 'apartamento', 'ativo', 82.5, -23.5614, -46.6858),
        ('Studio charmoso na Vila Madalena', 'Studio reformado, próximo a bares e galerias.', 380000, 38, 1, 1, 0, true, 'São Paulo', 'Vila Madalena', 'SP', 'Rua Harmonia, 120, Vila Madalena, SP', 'seed://sp-vilamadalena-001', 'seed', 'venda', 'apartamento', 'ativo', 75.0, -23.5537, -46.6907),
        ('Cobertura duplex nos Jardins', 'Cobertura luxuosa com terraço e churrasqueira, 4 suítes.', 3200000, 280, 4, 4, 3, false, 'São Paulo', 'Jardins', 'SP', 'Al. Santos, 1800, Jardins, SP', 'seed://sp-jardins-001', 'seed', 'venda', 'apartamento', 'ativo', 95.0, -23.5673, -46.6575),
        ('Apartamento 3 quartos em Moema', 'Planta ampla, lazer completo, vaga dupla.', 1100000, 130, 3, 2, 2, true, 'São Paulo', 'Moema', 'SP', 'Av. Ibirapuera, 2000, Moema, SP', 'seed://sp-moema-001', 'seed', 'venda', 'apartamento', 'ativo', 88.0, -23.6000, -46.6644),
        ('Flat executivo no Brooklin', 'Flat com serviços de hotel, ideal para executivos.', 520000, 55, 1, 1, 1, false, 'São Paulo', 'Brooklin', 'SP', 'Av. Engenheiro Luís Carlos Berrini, 300, Brooklin, SP', 'seed://sp-brooklin-001', 'seed', 'venda', 'apartamento', 'ativo', 78.5, -23.6165, -46.6979),
        ('Apartamento garden no Itaim Bibi', 'Garden com piscina privativa, condomínio de alto padrão.', 2400000, 200, 3, 3, 2, false, 'São Paulo', 'Itaim Bibi', 'SP', 'Rua Joaquim Floriano, 850, Itaim Bibi, SP', 'seed://sp-itaim-001', 'seed', 'venda', 'apartamento', 'ativo', 91.0, -23.5865, -46.6802),
        ('Casa sobrado na Lapa', 'Sobrado 4 quartos com quintal, rua tranquila.', 870000, 180, 4, 3, 2, true, 'São Paulo', 'Lapa', 'SP', 'Rua Guaicurus, 400, Lapa, SP', 'seed://sp-lapa-001', 'seed', 'venda', 'casa', 'ativo', 70.0, -23.5225, -46.7093),
        ('Apartamento 2 quartos em Santana', 'Prédio novo com academia e salão de festas.', 420000, 65, 2, 1, 1, true, 'São Paulo', 'Santana', 'SP', 'Av. Braz Leme, 1500, Santana, SP', 'seed://sp-santana-001', 'seed', 'venda', 'apartamento', 'ativo', 68.0, -23.4947, -46.6297),
        ('Apartamento compacto no Tatuapé', 'Bem localizado, próximo ao metrô Tatuapé.', 395000, 58, 2, 1, 1, true, 'São Paulo', 'Tatuapé', 'SP', 'Rua Serra de Jairé, 200, Tatuapé, SP', 'seed://sp-tatua-001', 'seed', 'venda', 'apartamento', 'ativo', 65.0, -23.5437, -46.5785),
        ('Apartamento 3 quartos em Perdizes', 'Metragem generosa, cozinha americana, 2 vagas.', 980000, 120, 3, 2, 2, true, 'São Paulo', 'Perdizes', 'SP', 'Rua Ministro Godói, 550, Perdizes, SP', 'seed://sp-perdizes-001', 'seed', 'venda', 'apartamento', 'ativo', 80.0, -23.5394, -46.6738),
        ('Studio na Bela Vista', 'Ótimo para investimento, próximo à Paulista.', 330000, 35, 1, 1, 0, true, 'São Paulo', 'Bela Vista', 'SP', 'Rua 13 de Maio, 300, Bela Vista, SP', 'seed://sp-belavista-001', 'seed', 'venda', 'apartamento', 'ativo', 72.0, -23.5611, -46.6490),
        ('Apartamento reformado na Aclimação', 'Totalmente reformado, ambientes integrados.', 560000, 80, 2, 2, 1, true, 'São Paulo', 'Aclimação', 'SP', 'Rua Muniz de Souza, 100, Aclimação, SP', 'seed://sp-aclimacao-001', 'seed', 'venda', 'apartamento', 'ativo', 76.0, -23.5750, -46.6320),
        ('Loft na Consolação', 'Loft pé-direito duplo, muito iluminado.', 495000, 60, 1, 1, 0, false, 'São Paulo', 'Consolação', 'SP', 'Rua da Consolação, 2000, Consolação, SP', 'seed://sp-consolacao-001', 'seed', 'venda', 'apartamento', 'ativo', 74.0, -23.5530, -46.6530),
        ('Apartamento 3 quartos no Campo Belo', 'Lazer completo, andar alto, vista panorâmica.', 1250000, 140, 3, 3, 2, false, 'São Paulo', 'Campo Belo', 'SP', 'Av. Santo Amaro, 4500, Campo Belo, SP', 'seed://sp-campobelo-001', 'seed', 'venda', 'apartamento', 'ativo', 85.0, -23.6260, -46.6700),
        ('Casa no Butantã com amplo terreno', 'Oportunidade: terreno 300m², casa 2 quartos.', 750000, 120, 2, 2, 2, true, 'São Paulo', 'Butantã', 'SP', 'Rua Alvarenga, 800, Butantã, SP', 'seed://sp-butanta-001', 'seed', 'venda', 'casa', 'ativo', 69.0, -23.5700, -46.7200),
        ('Apartamento 2 quartos em Ipanema', 'A 200m da praia, andar alto, ventilado.', 1800000, 85, 2, 2, 1, false, 'Rio de Janeiro', 'Ipanema', 'RJ', 'Rua Visconde de Pirajá, 300, Ipanema, RJ', 'seed://rj-ipanema-001', 'seed', 'venda', 'apartamento', 'ativo', 93.0, -22.9870, -43.2003),
        ('Kitnet com vista mar em Copacabana', 'Kitnet reformada, vista parcial para o mar.', 680000, 40, 1, 1, 0, false, 'Rio de Janeiro', 'Copacabana', 'RJ', 'Av. Atlântica, 1500, Copacabana, RJ', 'seed://rj-copacabana-001', 'seed', 'venda', 'apartamento', 'ativo', 87.0, -22.9700, -43.1829),
        ('Apartamento 4 quartos na Barra da Tijuca', 'Condomínio clube, 4 suítes, piscina, quadra.', 1650000, 190, 4, 4, 3, true, 'Rio de Janeiro', 'Barra da Tijuca', 'RJ', 'Av. das Américas, 3000, Barra da Tijuca, RJ', 'seed://rj-barra-001', 'seed', 'venda', 'apartamento', 'ativo', 89.0, -23.0029, -43.3652),
        ('Apartamento alto padrão na Savassi', 'Finamente acabado, localização prime BH.', 920000, 110, 3, 3, 2, false, 'Belo Horizonte', 'Savassi', 'MG', 'Rua Pernambuco, 400, Savassi, BH', 'seed://bh-savassi-001', 'seed', 'venda', 'apartamento', 'ativo', 86.0, -19.9395, -43.9378),
        ('Apartamento 2 quartos no Lourdes', 'Prédio moderno, próximo a hospitais e comércio.', 690000, 80, 2, 2, 1, true, 'Belo Horizonte', 'Lourdes', 'MG', 'Av. Álvares Cabral, 800, Lourdes, BH', 'seed://bh-lourdes-001', 'seed', 'venda', 'apartamento', 'ativo', 79.0, -19.9329, -43.9442)
        ON CONFLICT (url_origem) DO NOTHING
    """)

    op.execute("""
        UPDATE imoveis
        SET localizacao = ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND localizacao IS NULL
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_imoveis_sincronizar_localizacao ON imoveis")
    op.execute("DROP FUNCTION IF EXISTS trg_sincronizar_localizacao()")

    for tbl in [
        "documentos", "comissoes", "propostas",
        "atividades_lead", "leads", "agendamentos",
        "visualizacoes_imovel", "favoritos", "midias_imovel",
        "disponibilidade_imovel", "responsaveis_imovel", "mandatos",
        "perfis_comprador", "mensagens_whatsapp", "sessoes_whatsapp",
        "imoveis", "proprietarios", "usuarios",
    ]:
        op.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE")
