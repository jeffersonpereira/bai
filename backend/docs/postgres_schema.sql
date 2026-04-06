-- Ativação da extensão para geometria/espaço e uuid
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Types ENUM para controle seguro na camada de BD
CREATE TYPE user_role AS ENUM ('user', 'broker', 'agency', 'admin');
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'premium');
CREATE TYPE property_status AS ENUM ('active', 'pending', 'archived', 'suspended');
CREATE TYPE listing_type AS ENUM ('venda', 'aluguel', 'temporada');
CREATE TYPE property_type AS ENUM ('casa', 'apartamento', 'terreno', 'comercial');

-- Tabela Usuários (Multi-tenant hierarchy)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role user_role DEFAULT 'user',
    plan_type user_plan DEFAULT 'free',
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    phone VARCHAR(50),
    creci VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    parent_id UUID REFERENCES users(id), -- Hierarquia (Agência -> Corretor)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Imóveis Central (Usando Geo, JSONB e FTS)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL,
    area NUMERIC(10,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    garage_spaces INTEGER DEFAULT 0,
    financing_eligible BOOLEAN DEFAULT false,
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    state VARCHAR(50),
    full_address TEXT,
    location GEOMETRY(Point, 4326),  -- Long/Lat padrão do GPS
    source_url VARCHAR(500) UNIQUE,
    image_url VARCHAR(500),
    source VARCHAR(100),
    list_type listing_type DEFAULT 'venda',
    type_prop property_type DEFAULT 'apartamento',
    status property_status DEFAULT 'active',
    owner_id UUID REFERENCES users(id), -- Corretor / Agência / Privado
    actual_owner_id UUID REFERENCES users(id), -- Dono Real 
    commission_percentage NUMERIC(5,2),
    market_score NUMERIC(5,2) DEFAULT 0.0,
    valor_aluguel NUMERIC(15,2),
    atributos_extras JSONB,  -- Dados flexíveis ex: {"piscina": true, "guarita": false}
    is_star BOOLEAN DEFAULT false,
    text_search TSVECTOR,    -- Indexação de Busca Textual rápida
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de Performance Imóveis
CREATE INDEX idx_prop_location ON properties USING GIST (location);
CREATE INDEX idx_prop_attr_json ON properties USING GIN (atributos_extras);
CREATE INDEX idx_prop_price ON properties (price);
CREATE INDEX idx_prop_city_neigh ON properties (city, neighborhood);
CREATE INDEX idx_prop_status_type ON properties (status, list_type);

-- Trigger e Indíce Full-Text
CREATE OR REPLACE FUNCTION properties_search_trigger() RETURNS trigger AS $$
begin
  new.text_search :=
     setweight(to_tsvector('portuguese', unaccent(coalesce(new.title,''))), 'A') ||
     setweight(to_tsvector('portuguese', unaccent(coalesce(new.neighborhood,''))), 'B') ||
     setweight(to_tsvector('portuguese', unaccent(coalesce(new.description,''))), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON properties FOR EACH ROW EXECUTE PROCEDURE properties_search_trigger();

CREATE INDEX idx_prop_text_search ON properties USING GIN (text_search);


-- Tabela de Configuração de Visitas (Appointments)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    broker_id UUID REFERENCES users(id),
    visitor_user_id UUID REFERENCES users(id),
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(50) NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    visit_end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    feedback_visita TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appt_dates ON appointments (visit_date);
CREATE INDEX idx_appt_broker ON appointments (broker_id);


-- Tabela de Logs e Analytics Particionada (Estratégia de Performance)
-- Ao usar PARTITION BY RANGE podemos garantir queries rápidas e apagar meses com O(1)
CREATE TABLE property_views (
    id BIGSERIAL,
    property_id UUID NOT NULL REFERENCES properties(id),
    user_id UUID,  -- Nulo se for anônimo
    ip_address VARCHAR(45),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, viewed_at)
) PARTITION BY RANGE (viewed_at);

-- Exemplo de partição para Maio de 2026
CREATE TABLE property_views_2026_05 PARTITION OF property_views
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');


-- ======================================================= --
-- IMPLEMENTAÇÃO DE RLS (Row Level Security)               --
-- Protege o banco de dados contra vazamentos de acessos.  --
-- ======================================================= --

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 1) Usuários (qualquer pessoa) lendo o Front-End
CREATE POLICY public_read_active_properties ON properties 
    FOR SELECT 
    USING (status = 'active');

-- 2) Corretores lidando com a gestão
-- Essa ROLE (ex: authenticated) viria das claims do sistema via set_config
CREATE POLICY broker_all_operations_own_properties ON properties
    FOR ALL
    USING (
         owner_id = current_setting('jwt.claims.user_id')::uuid 
         OR 
         actual_owner_id = current_setting('jwt.claims.user_id')::uuid
    );

-- 3) Admin master visualizando e editando tudo
CREATE POLICY admin_bypass_rls ON properties
    FOR ALL
    USING (current_setting('jwt.claims.role') = 'admin');
