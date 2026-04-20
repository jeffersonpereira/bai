"""add PostGIS extension, lat/lng/location to properties, GIST index, and seed data

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Habilitar extensão PostGIS ─────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # ── 2. Adicionar lat / lng na tabela properties ──────────────────────────
    op.add_column("properties", sa.Column("lat", sa.Numeric(10, 7), nullable=True))
    op.add_column("properties", sa.Column("lng", sa.Numeric(10, 7), nullable=True))

    # ── 3. Adicionar coluna geometry gerenciada pelo DB ───────────────────────
    # Tipo geometry(Point, 4326) — SRID 4326 = WGS 84 (GPS padrão)
    op.execute(
        "ALTER TABLE properties ADD COLUMN IF NOT EXISTS "
        "location geometry(Point, 4326)"
    )

    # ── 4. Trigger: sincroniza location sempre que lat/lng mudam ─────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION trg_sync_location()
        RETURNS trigger AS $$
        BEGIN
            IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
                NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng::float8, NEW.lat::float8), 4326);
            ELSE
                NEW.location := NULL;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)

    op.execute("""
        DROP TRIGGER IF EXISTS trg_properties_sync_location ON properties
    """)

    op.execute("""
        CREATE TRIGGER trg_properties_sync_location
            BEFORE INSERT OR UPDATE OF lat, lng
            ON properties
            FOR EACH ROW
            EXECUTE FUNCTION trg_sync_location()
    """)

    # ── 5. Índice GIST na coluna geometry ────────────────────────────────────
    # Suporta bounding-box queries via &&, ST_Within, ST_DWithin
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_properties_location_gist "
        "ON properties USING gist(location)"
    )

    # Índice BTREE composto em (lat, lng) para filtros simples sem PostGIS
    op.create_index("ix_properties_lat_lng", "properties", ["lat", "lng"], unique=False)

    # ── 6. Seed: ~20 imóveis com coordenadas reais SP / RJ / BH ──────────────
    # ON CONFLICT ignora duplicatas se a migration for re-executada
    op.execute("""
        INSERT INTO properties (
            title, description, price, area, bedrooms, bathrooms, garage_spaces,
            financing_eligible, city, neighborhood, state, full_address,
            source_url, source, listing_type, property_type, status,
            market_score, lat, lng
        ) VALUES
        -- São Paulo
        ('Apartamento moderno em Pinheiros',
         'Amplo 2 quartos próximo ao metrô, varanda gourmet.',
         650000, 75, 2, 2, 1, true,
         'São Paulo', 'Pinheiros', 'SP', 'Rua dos Pinheiros, 500, Pinheiros, SP',
         'seed://sp-pinheiros-001', 'seed', 'venda', 'apartamento', 'active',
         82.5, -23.5614, -46.6858),

        ('Studio charmoso na Vila Madalena',
         'Studio reformado, próximo a bares e galerias.',
         380000, 38, 1, 1, 0, true,
         'São Paulo', 'Vila Madalena', 'SP', 'Rua Harmonia, 120, Vila Madalena, SP',
         'seed://sp-vilamadalena-001', 'seed', 'venda', 'apartamento', 'active',
         75.0, -23.5537, -46.6907),

        ('Cobertura duplex nos Jardins',
         'Cobertura luxuosa com terraço e churrasqueira, 4 suítes.',
         3200000, 280, 4, 4, 3, false,
         'São Paulo', 'Jardins', 'SP', 'Al. Santos, 1800, Jardins, SP',
         'seed://sp-jardins-001', 'seed', 'venda', 'apartamento', 'active',
         95.0, -23.5673, -46.6575),

        ('Apartamento 3 quartos em Moema',
         'Planta ampla, lazer completo, vaga dupla.',
         1100000, 130, 3, 2, 2, true,
         'São Paulo', 'Moema', 'SP', 'Av. Ibirapuera, 2000, Moema, SP',
         'seed://sp-moema-001', 'seed', 'venda', 'apartamento', 'active',
         88.0, -23.6000, -46.6644),

        ('Flat executivo no Brooklin',
         'Flat com serviços de hotel, ideal para executivos.',
         520000, 55, 1, 1, 1, false,
         'São Paulo', 'Brooklin', 'SP', 'Av. Engenheiro Luís Carlos Berrini, 300, Brooklin, SP',
         'seed://sp-brooklin-001', 'seed', 'venda', 'apartamento', 'active',
         78.5, -23.6165, -46.6979),

        ('Apartamento garden no Itaim Bibi',
         'Garden com piscina privativa, condomínio de alto padrão.',
         2400000, 200, 3, 3, 2, false,
         'São Paulo', 'Itaim Bibi', 'SP', 'Rua Joaquim Floriano, 850, Itaim Bibi, SP',
         'seed://sp-itaim-001', 'seed', 'venda', 'apartamento', 'active',
         91.0, -23.5865, -46.6802),

        ('Casa sobrado na Lapa',
         'Sobrado 4 quartos com quintal, rua tranquila.',
         870000, 180, 4, 3, 2, true,
         'São Paulo', 'Lapa', 'SP', 'Rua Guaicurus, 400, Lapa, SP',
         'seed://sp-lapa-001', 'seed', 'venda', 'casa', 'active',
         70.0, -23.5225, -46.7093),

        ('Apartamento 2 quartos em Santana',
         'Prédio novo com academia e salão de festas.',
         420000, 65, 2, 1, 1, true,
         'São Paulo', 'Santana', 'SP', 'Av. Braz Leme, 1500, Santana, SP',
         'seed://sp-santana-001', 'seed', 'venda', 'apartamento', 'active',
         68.0, -23.4947, -46.6297),

        ('Apartamento compacto no Tatuapé',
         'Bem localizado, próximo ao metrô Tatuapé.',
         395000, 58, 2, 1, 1, true,
         'São Paulo', 'Tatuapé', 'SP', 'Rua Serra de Jairé, 200, Tatuapé, SP',
         'seed://sp-tatua-001', 'seed', 'venda', 'apartamento', 'active',
         65.0, -23.5437, -46.5785),

        ('Apartamento 3 quartos em Perdizes',
         'Metragem generosa, cozinha americana, 2 vagas.',
         980000, 120, 3, 2, 2, true,
         'São Paulo', 'Perdizes', 'SP', 'Rua Ministro Godói, 550, Perdizes, SP',
         'seed://sp-perdizes-001', 'seed', 'venda', 'apartamento', 'active',
         80.0, -23.5394, -46.6738),

        ('Studio na Bela Vista',
         'Ótimo para investimento, próximo à Paulista.',
         330000, 35, 1, 1, 0, true,
         'São Paulo', 'Bela Vista', 'SP', 'Rua 13 de Maio, 300, Bela Vista, SP',
         'seed://sp-belavista-001', 'seed', 'venda', 'apartamento', 'active',
         72.0, -23.5611, -46.6490),

        ('Apartamento reformado na Aclimação',
         'Totalmente reformado, ambientes integrados.',
         560000, 80, 2, 2, 1, true,
         'São Paulo', 'Aclimação', 'SP', 'Rua Muniz de Souza, 100, Aclimação, SP',
         'seed://sp-aclimacao-001', 'seed', 'venda', 'apartamento', 'active',
         76.0, -23.5750, -46.6320),

        ('Loft na Consolação',
         'Loft pé-direito duplo, muito iluminado.',
         495000, 60, 1, 1, 0, false,
         'São Paulo', 'Consolação', 'SP', 'Rua da Consolação, 2000, Consolação, SP',
         'seed://sp-consolacao-001', 'seed', 'venda', 'apartamento', 'active',
         74.0, -23.5530, -46.6530),

        ('Apartamento 3 quartos no Campo Belo',
         'Lazer completo, andar alto, vista panorâmica.',
         1250000, 140, 3, 3, 2, false,
         'São Paulo', 'Campo Belo', 'SP', 'Av. Santo Amaro, 4500, Campo Belo, SP',
         'seed://sp-campobelo-001', 'seed', 'venda', 'apartamento', 'active',
         85.0, -23.6260, -46.6700),

        ('Casa no Butantã com amplo terreno',
         'Oportunidade: terreno 300m², casa 2 quartos.',
         750000, 120, 2, 2, 2, true,
         'São Paulo', 'Butantã', 'SP', 'Rua Alvarenga, 800, Butantã, SP',
         'seed://sp-butanta-001', 'seed', 'venda', 'casa', 'active',
         69.0, -23.5700, -46.7200),

        -- Rio de Janeiro
        ('Apartamento 2 quartos em Ipanema',
         'A 200m da praia, andar alto, ventilado.',
         1800000, 85, 2, 2, 1, false,
         'Rio de Janeiro', 'Ipanema', 'RJ', 'Rua Visconde de Pirajá, 300, Ipanema, RJ',
         'seed://rj-ipanema-001', 'seed', 'venda', 'apartamento', 'active',
         93.0, -22.9870, -43.2003),

        ('Kitnet com vista mar em Copacabana',
         'Kitnet reformada, vista parcial para o mar.',
         680000, 40, 1, 1, 0, false,
         'Rio de Janeiro', 'Copacabana', 'RJ', 'Av. Atlântica, 1500, Copacabana, RJ',
         'seed://rj-copacabana-001', 'seed', 'venda', 'apartamento', 'active',
         87.0, -22.9700, -43.1829),

        ('Apartamento 4 quartos na Barra da Tijuca',
         'Condomínio clube, 4 suítes, piscina, quadra.',
         1650000, 190, 4, 4, 3, true,
         'Rio de Janeiro', 'Barra da Tijuca', 'RJ', 'Av. das Américas, 3000, Barra da Tijuca, RJ',
         'seed://rj-barra-001', 'seed', 'venda', 'apartamento', 'active',
         89.0, -23.0029, -43.3652),

        -- Belo Horizonte
        ('Apartamento alto padrão na Savassi',
         'Finamente acabado, localização prime BH.',
         920000, 110, 3, 3, 2, false,
         'Belo Horizonte', 'Savassi', 'MG', 'Rua Pernambuco, 400, Savassi, BH',
         'seed://bh-savassi-001', 'seed', 'venda', 'apartamento', 'active',
         86.0, -19.9395, -43.9378),

        ('Apartamento 2 quartos no Lourdes',
         'Prédio moderno, próximo a hospitais e comércio.',
         690000, 80, 2, 2, 1, true,
         'Belo Horizonte', 'Lourdes', 'MG', 'Av. Álvares Cabral, 800, Lourdes, BH',
         'seed://bh-lourdes-001', 'seed', 'venda', 'apartamento', 'active',
         79.0, -19.9329, -43.9442)

        ON CONFLICT (source_url) DO NOTHING
    """)

    # Atualiza location para os rows recém-inseridos (trigger só age em NEW rows)
    op.execute("""
        UPDATE properties
        SET location = ST_SetSRID(ST_MakePoint(lng::float8, lat::float8), 4326)
        WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_properties_sync_location ON properties")
    op.execute("DROP FUNCTION IF EXISTS trg_sync_location()")
    op.execute("DROP INDEX IF EXISTS ix_properties_location_gist")
    op.drop_index("ix_properties_lat_lng", table_name="properties")
    op.execute("ALTER TABLE properties DROP COLUMN IF EXISTS location")
    op.drop_column("properties", "lng")
    op.drop_column("properties", "lat")
    # Nota: extensão postgis não é removida — pode ser usada por outras tabelas/funções
