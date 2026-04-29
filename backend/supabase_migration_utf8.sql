BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 947135247b5a

CREATE TABLE users (
    id SERIAL NOT NULL, 
    email VARCHAR NOT NULL, 
    hashed_password VARCHAR NOT NULL, 
    name VARCHAR, 
    role VARCHAR, 
    plan_type VARCHAR, 
    plan_expires_at TIMESTAMP WITH TIME ZONE, 
    phone VARCHAR, 
    creci VARCHAR, 
    is_active BOOLEAN, 
    parent_id INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_users PRIMARY KEY (id), 
    CONSTRAINT fk_users_parent_id_users FOREIGN KEY(parent_id) REFERENCES users (id)
);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_id ON users (id);

CREATE INDEX ix_users_plan_type ON users (plan_type);

CREATE INDEX ix_users_role ON users (role);

CREATE TABLE buyer_profiles (
    id SERIAL NOT NULL, 
    user_id INTEGER, 
    name VARCHAR, 
    min_price FLOAT, 
    max_price FLOAT, 
    city VARCHAR, 
    neighborhood VARCHAR, 
    property_type VARCHAR, 
    listing_type VARCHAR, 
    min_bedrooms INTEGER, 
    min_bathrooms INTEGER, 
    min_garage_spaces INTEGER, 
    financing_approved BOOLEAN, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    updated_at TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_buyer_profiles PRIMARY KEY (id), 
    CONSTRAINT fk_buyer_profiles_user_id_users FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_buyer_profiles_id ON buyer_profiles (id);

CREATE INDEX ix_buyer_profiles_user_id ON buyer_profiles (user_id);

CREATE TABLE owners (
    id SERIAL NOT NULL, 
    name VARCHAR NOT NULL, 
    email VARCHAR, 
    phone VARCHAR, 
    document VARCHAR, 
    address VARCHAR, 
    notes VARCHAR, 
    broker_id INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_owners PRIMARY KEY (id), 
    CONSTRAINT fk_owners_broker_id_users FOREIGN KEY(broker_id) REFERENCES users (id)
);

CREATE INDEX ix_owners_email ON owners (email);

CREATE INDEX ix_owners_id ON owners (id);

CREATE TABLE whatsapp_messages (
    id SERIAL NOT NULL, 
    user_id INTEGER NOT NULL, 
    chat_jid VARCHAR NOT NULL, 
    message_id VARCHAR, 
    direction VARCHAR NOT NULL, 
    body TEXT NOT NULL, 
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_whatsapp_messages PRIMARY KEY (id), 
    CONSTRAINT fk_whatsapp_messages_user_id_users FOREIGN KEY(user_id) REFERENCES users (id), 
    CONSTRAINT uq_whatsapp_messages_message_id UNIQUE (message_id)
);

CREATE INDEX ix_whatsapp_messages_chat_jid ON whatsapp_messages (chat_jid);

CREATE INDEX ix_whatsapp_messages_id ON whatsapp_messages (id);

CREATE INDEX ix_whatsapp_messages_user_id ON whatsapp_messages (user_id);

CREATE TABLE whatsapp_sessions (
    id SERIAL NOT NULL, 
    user_id INTEGER NOT NULL, 
    status VARCHAR, 
    connected_at TIMESTAMP WITH TIME ZONE, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_whatsapp_sessions PRIMARY KEY (id), 
    CONSTRAINT fk_whatsapp_sessions_user_id_users FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_whatsapp_sessions_id ON whatsapp_sessions (id);

CREATE UNIQUE INDEX ix_whatsapp_sessions_user_id ON whatsapp_sessions (user_id);

CREATE TABLE properties (
    id SERIAL NOT NULL, 
    title VARCHAR NOT NULL, 
    description VARCHAR, 
    price FLOAT NOT NULL, 
    area FLOAT, 
    bedrooms INTEGER, 
    bathrooms INTEGER, 
    garage_spaces INTEGER, 
    financing_eligible BOOLEAN, 
    city VARCHAR, 
    neighborhood VARCHAR, 
    state VARCHAR, 
    full_address VARCHAR, 
    source_url VARCHAR, 
    image_url VARCHAR, 
    source VARCHAR, 
    listing_type VARCHAR, 
    property_type VARCHAR, 
    status VARCHAR, 
    owner_id INTEGER, 
    actual_owner_id INTEGER, 
    commission_percentage FLOAT, 
    market_score FLOAT, 
    valor_aluguel FLOAT, 
    atributos_extras JSON, 
    is_star BOOLEAN, 
    last_analysis_at TIMESTAMP WITH TIME ZONE, 
    views_count INTEGER DEFAULT '0', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    lat NUMERIC(10, 7), 
    lng NUMERIC(10, 7), 
    CONSTRAINT pk_properties PRIMARY KEY (id), 
    CONSTRAINT fk_properties_actual_owner_id_owners FOREIGN KEY(actual_owner_id) REFERENCES owners (id), 
    CONSTRAINT fk_properties_owner_id_users FOREIGN KEY(owner_id) REFERENCES users (id), 
    CONSTRAINT uq_properties_source_url UNIQUE (source_url)
);

CREATE INDEX ix_properties_area ON properties (area);

CREATE INDEX ix_properties_bedrooms ON properties (bedrooms);

CREATE INDEX ix_properties_city ON properties (city);

CREATE INDEX ix_properties_created_at ON properties (created_at);

CREATE INDEX ix_properties_id ON properties (id);

CREATE INDEX ix_properties_listing_type ON properties (listing_type);

CREATE INDEX ix_properties_neighborhood ON properties (neighborhood);

CREATE INDEX ix_properties_price ON properties (price);

CREATE INDEX ix_properties_property_type ON properties (property_type);

CREATE INDEX ix_properties_state ON properties (state);

CREATE INDEX ix_properties_status ON properties (status);

CREATE INDEX ix_properties_title ON properties (title);

CREATE INDEX ix_properties_views_count ON properties (views_count);

CREATE TABLE appointments (
    id SERIAL NOT NULL, 
    property_id INTEGER NOT NULL, 
    broker_id INTEGER, 
    buyer_id INTEGER, 
    visitor_name VARCHAR NOT NULL, 
    visitor_phone VARCHAR NOT NULL, 
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL, 
    visit_end_time TIMESTAMP WITH TIME ZONE, 
    status VARCHAR, 
    notes TEXT, 
    feedback_visita TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_appointments PRIMARY KEY (id), 
    CONSTRAINT fk_appointments_broker_id_users FOREIGN KEY(broker_id) REFERENCES users (id), 
    CONSTRAINT fk_appointments_buyer_id_users FOREIGN KEY(buyer_id) REFERENCES users (id), 
    CONSTRAINT fk_appointments_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE INDEX ix_appointments_id ON appointments (id);

CREATE TABLE favorites (
    id SERIAL NOT NULL, 
    user_id INTEGER, 
    property_id INTEGER, 
    nivel_interesse INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_favorites PRIMARY KEY (id), 
    CONSTRAINT fk_favorites_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id), 
    CONSTRAINT fk_favorites_user_id_users FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_favorites_id ON favorites (id);

CREATE TABLE leads (
    id SERIAL NOT NULL, 
    property_id INTEGER, 
    broker_id INTEGER, 
    name VARCHAR NOT NULL, 
    email VARCHAR, 
    phone VARCHAR, 
    source VARCHAR, 
    status VARCHAR, 
    notes VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_leads PRIMARY KEY (id), 
    CONSTRAINT fk_leads_broker_id_users FOREIGN KEY(broker_id) REFERENCES users (id), 
    CONSTRAINT fk_leads_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE INDEX ix_leads_id ON leads (id);

CREATE TABLE mandates (
    id SERIAL NOT NULL, 
    property_id INTEGER, 
    owner_id INTEGER, 
    broker_id INTEGER, 
    type VARCHAR, 
    commission_percentage FLOAT, 
    is_exclusive BOOLEAN, 
    expiry_date TIMESTAMP WITHOUT TIME ZONE, 
    status VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_mandates PRIMARY KEY (id), 
    CONSTRAINT fk_mandates_broker_id_users FOREIGN KEY(broker_id) REFERENCES users (id), 
    CONSTRAINT fk_mandates_owner_id_owners FOREIGN KEY(owner_id) REFERENCES owners (id), 
    CONSTRAINT fk_mandates_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE INDEX ix_mandates_id ON mandates (id);

CREATE TABLE property_assignments (
    property_id INTEGER NOT NULL, 
    user_id INTEGER NOT NULL, 
    role VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_property_assignments PRIMARY KEY (property_id, user_id), 
    CONSTRAINT fk_property_assignments_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id), 
    CONSTRAINT fk_property_assignments_user_id_users FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE property_availability (
    id SERIAL NOT NULL, 
    property_id INTEGER NOT NULL, 
    day_of_week INTEGER, 
    start_time TIME WITHOUT TIME ZONE NOT NULL, 
    end_time TIME WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_property_availability PRIMARY KEY (id), 
    CONSTRAINT fk_property_availability_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE INDEX ix_property_availability_id ON property_availability (id);

CREATE TABLE property_media (
    id SERIAL NOT NULL, 
    property_id INTEGER, 
    media_type VARCHAR, 
    url VARCHAR, 
    CONSTRAINT pk_property_media PRIMARY KEY (id), 
    CONSTRAINT fk_property_media_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE INDEX ix_property_media_id ON property_media (id);

CREATE TABLE property_views (
    id SERIAL NOT NULL, 
    user_id INTEGER NOT NULL, 
    property_id INTEGER NOT NULL, 
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_property_views PRIMARY KEY (id), 
    CONSTRAINT fk_property_views_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id), 
    CONSTRAINT fk_property_views_user_id_users FOREIGN KEY(user_id) REFERENCES users (id), 
    CONSTRAINT uq_property_views_user_property UNIQUE (user_id, property_id)
);

CREATE INDEX ix_property_views_id ON property_views (id);

CREATE INDEX ix_property_views_property_id ON property_views (property_id);

CREATE INDEX ix_property_views_user_id ON property_views (user_id);

CREATE TABLE proposals (
    id SERIAL NOT NULL, 
    property_id INTEGER NOT NULL, 
    buyer_user_id INTEGER, 
    buyer_name VARCHAR NOT NULL, 
    buyer_email VARCHAR, 
    buyer_phone VARCHAR, 
    proposed_price FLOAT NOT NULL, 
    payment_method VARCHAR, 
    financing_percentage FLOAT, 
    conditions VARCHAR, 
    message VARCHAR, 
    status VARCHAR, 
    broker_id INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_proposals PRIMARY KEY (id), 
    CONSTRAINT fk_proposals_broker_id_users FOREIGN KEY(broker_id) REFERENCES users (id), 
    CONSTRAINT fk_proposals_buyer_user_id_users FOREIGN KEY(buyer_user_id) REFERENCES users (id), 
    CONSTRAINT fk_proposals_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE INDEX ix_proposals_buyer_user_id ON proposals (buyer_user_id);

CREATE INDEX ix_proposals_id ON proposals (id);

CREATE INDEX ix_proposals_property_id ON proposals (property_id);

CREATE INDEX ix_proposals_status ON proposals (status);

CREATE TABLE comissoes (
    id SERIAL NOT NULL, 
    proposal_id INTEGER, 
    property_id INTEGER NOT NULL, 
    corretor_id INTEGER NOT NULL, 
    agency_id INTEGER, 
    valor_imovel FLOAT NOT NULL, 
    percentual FLOAT NOT NULL, 
    valor_comissao FLOAT NOT NULL, 
    status_pagamento VARCHAR, 
    observacoes VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    paid_at TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_comissoes PRIMARY KEY (id), 
    CONSTRAINT fk_comissoes_agency_id_users FOREIGN KEY(agency_id) REFERENCES users (id), 
    CONSTRAINT fk_comissoes_corretor_id_users FOREIGN KEY(corretor_id) REFERENCES users (id), 
    CONSTRAINT fk_comissoes_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id), 
    CONSTRAINT fk_comissoes_proposal_id_proposals FOREIGN KEY(proposal_id) REFERENCES proposals (id)
);

CREATE INDEX ix_comissoes_corretor_id ON comissoes (corretor_id);

CREATE INDEX ix_comissoes_id ON comissoes (id);

CREATE INDEX ix_comissoes_property_id ON comissoes (property_id);

CREATE INDEX ix_comissoes_proposal_id ON comissoes (proposal_id);

CREATE INDEX ix_comissoes_status_pagamento ON comissoes (status_pagamento);

CREATE TABLE documents (
    id SERIAL NOT NULL, 
    title VARCHAR NOT NULL, 
    doc_type VARCHAR NOT NULL, 
    description VARCHAR, 
    file_name VARCHAR, 
    file_url VARCHAR, 
    file_size BIGINT, 
    status VARCHAR, 
    uploaded_by INTEGER NOT NULL, 
    property_id INTEGER, 
    proposal_id INTEGER, 
    notes VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_documents PRIMARY KEY (id), 
    CONSTRAINT fk_documents_property_id_properties FOREIGN KEY(property_id) REFERENCES properties (id), 
    CONSTRAINT fk_documents_proposal_id_proposals FOREIGN KEY(proposal_id) REFERENCES proposals (id), 
    CONSTRAINT fk_documents_uploaded_by_users FOREIGN KEY(uploaded_by) REFERENCES users (id)
);

CREATE INDEX ix_documents_doc_type ON documents (doc_type);

CREATE INDEX ix_documents_id ON documents (id);

CREATE INDEX ix_documents_property_id ON documents (property_id);

CREATE INDEX ix_documents_proposal_id ON documents (proposal_id);

CREATE INDEX ix_documents_status ON documents (status);

CREATE INDEX ix_documents_uploaded_by ON documents (uploaded_by);

CREATE TABLE lead_activities (
    id SERIAL NOT NULL, 
    lead_id INTEGER, 
    user_id INTEGER, 
    activity_type VARCHAR, 
    description VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_lead_activities PRIMARY KEY (id), 
    CONSTRAINT fk_lead_activities_lead_id_leads FOREIGN KEY(lead_id) REFERENCES leads (id), 
    CONSTRAINT fk_lead_activities_user_id_users FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_lead_activities_id ON lead_activities (id);

INSERT INTO alembic_version (version_num) VALUES ('947135247b5a') RETURNING alembic_version.version_num;

-- Running upgrade 947135247b5a -> 09d1da6a1c6a

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

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
        $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_sync_location ON properties;

CREATE TRIGGER trg_properties_sync_location
            BEFORE INSERT OR UPDATE OF lat, lng
            ON properties
            FOR EACH ROW
            EXECUTE FUNCTION trg_sync_location();

CREATE INDEX IF NOT EXISTS ix_properties_location_gist ON properties USING gist(location);

CREATE INDEX ix_properties_lat_lng ON properties (lat, lng);

INSERT INTO properties (
            title, description, price, area, bedrooms, bathrooms, garage_spaces,
            financing_eligible, city, neighborhood, state, full_address,
            source_url, source, listing_type, property_type, status,
            market_score, lat, lng
        ) VALUES
        -- SÒo Paulo
        ('Apartamento moderno em Pinheiros', 'Amplo 2 quartos pr¾ximo ao metr¶, varanda gourmet.', 650000, 75, 2, 2, 1, true, 'SÒo Paulo', 'Pinheiros', 'SP', 'Rua dos Pinheiros, 500, Pinheiros, SP', 'seed://sp-pinheiros-001', 'seed', 'venda', 'apartamento', 'active', 82.5, -23.5614, -46.6858),
        ('Studio charmoso na Vila Madalena', 'Studio reformado, pr¾ximo a bares e galerias.', 380000, 38, 1, 1, 0, true, 'SÒo Paulo', 'Vila Madalena', 'SP', 'Rua Harmonia, 120, Vila Madalena, SP', 'seed://sp-vilamadalena-001', 'seed', 'venda', 'apartamento', 'active', 75.0, -23.5537, -46.6907),
        ('Cobertura duplex nos Jardins', 'Cobertura luxuosa com terraþo e churrasqueira, 4 suÝtes.', 3200000, 280, 4, 4, 3, false, 'SÒo Paulo', 'Jardins', 'SP', 'Al. Santos, 1800, Jardins, SP', 'seed://sp-jardins-001', 'seed', 'venda', 'apartamento', 'active', 95.0, -23.5673, -46.6575),
        ('Apartamento 3 quartos em Moema', 'Planta ampla, lazer completo, vaga dupla.', 1100000, 130, 3, 2, 2, true, 'SÒo Paulo', 'Moema', 'SP', 'Av. Ibirapuera, 2000, Moema, SP', 'seed://sp-moema-001', 'seed', 'venda', 'apartamento', 'active', 88.0, -23.6000, -46.6644),
        ('Flat executivo no Brooklin', 'Flat com serviþos de hotel, ideal para executivos.', 520000, 55, 1, 1, 1, false, 'SÒo Paulo', 'Brooklin', 'SP', 'Av. Engenheiro LuÝs Carlos Berrini, 300, Brooklin, SP', 'seed://sp-brooklin-001', 'seed', 'venda', 'apartamento', 'active', 78.5, -23.6165, -46.6979),
        ('Apartamento garden no Itaim Bibi', 'Garden com piscina privativa, condomÝnio de alto padrÒo.', 2400000, 200, 3, 3, 2, false, 'SÒo Paulo', 'Itaim Bibi', 'SP', 'Rua Joaquim Floriano, 850, Itaim Bibi, SP', 'seed://sp-itaim-001', 'seed', 'venda', 'apartamento', 'active', 91.0, -23.5865, -46.6802),
        ('Casa sobrado na Lapa', 'Sobrado 4 quartos com quintal, rua tranquila.', 870000, 180, 4, 3, 2, true, 'SÒo Paulo', 'Lapa', 'SP', 'Rua Guaicurus, 400, Lapa, SP', 'seed://sp-lapa-001', 'seed', 'venda', 'casa', 'active', 70.0, -23.5225, -46.7093),
        ('Apartamento 2 quartos em Santana', 'PrÚdio novo com academia e salÒo de festas.', 420000, 65, 2, 1, 1, true, 'SÒo Paulo', 'Santana', 'SP', 'Av. Braz Leme, 1500, Santana, SP', 'seed://sp-santana-001', 'seed', 'venda', 'apartamento', 'active', 68.0, -23.4947, -46.6297),
        ('Apartamento compacto no TatuapÚ', 'Bem localizado, pr¾ximo ao metr¶ TatuapÚ.', 395000, 58, 2, 1, 1, true, 'SÒo Paulo', 'TatuapÚ', 'SP', 'Rua Serra de JairÚ, 200, TatuapÚ, SP', 'seed://sp-tatua-001', 'seed', 'venda', 'apartamento', 'active', 65.0, -23.5437, -46.5785),
        ('Apartamento 3 quartos em Perdizes', 'Metragem generosa, cozinha americana, 2 vagas.', 980000, 120, 3, 2, 2, true, 'SÒo Paulo', 'Perdizes', 'SP', 'Rua Ministro God¾i, 550, Perdizes, SP', 'seed://sp-perdizes-001', 'seed', 'venda', 'apartamento', 'active', 80.0, -23.5394, -46.6738),
        ('Studio na Bela Vista', 'Ëtimo para investimento, pr¾ximo Ó Paulista.', 330000, 35, 1, 1, 0, true, 'SÒo Paulo', 'Bela Vista', 'SP', 'Rua 13 de Maio, 300, Bela Vista, SP', 'seed://sp-belavista-001', 'seed', 'venda', 'apartamento', 'active', 72.0, -23.5611, -46.6490),
        ('Apartamento reformado na AclimaþÒo', 'Totalmente reformado, ambientes integrados.', 560000, 80, 2, 2, 1, true, 'SÒo Paulo', 'AclimaþÒo', 'SP', 'Rua Muniz de Souza, 100, AclimaþÒo, SP', 'seed://sp-aclimacao-001', 'seed', 'venda', 'apartamento', 'active', 76.0, -23.5750, -46.6320),
        ('Loft na ConsolaþÒo', 'Loft pÚ-direito duplo, muito iluminado.', 495000, 60, 1, 1, 0, false, 'SÒo Paulo', 'ConsolaþÒo', 'SP', 'Rua da ConsolaþÒo, 2000, ConsolaþÒo, SP', 'seed://sp-consolacao-001', 'seed', 'venda', 'apartamento', 'active', 74.0, -23.5530, -46.6530),
        ('Apartamento 3 quartos no Campo Belo', 'Lazer completo, andar alto, vista panorÔmica.', 1250000, 140, 3, 3, 2, false, 'SÒo Paulo', 'Campo Belo', 'SP', 'Av. Santo Amaro, 4500, Campo Belo, SP', 'seed://sp-campobelo-001', 'seed', 'venda', 'apartamento', 'active', 85.0, -23.6260, -46.6700),
        ('Casa no ButantÒ com amplo terreno', 'Oportunidade: terreno 300m▓, casa 2 quartos.', 750000, 120, 2, 2, 2, true, 'SÒo Paulo', 'ButantÒ', 'SP', 'Rua Alvarenga, 800, ButantÒ, SP', 'seed://sp-butanta-001', 'seed', 'venda', 'casa', 'active', 69.0, -23.5700, -46.7200),
        
        -- Rio de Janeiro
        ('Apartamento 2 quartos em Ipanema', 'A 200m da praia, andar alto, ventilado.', 1800000, 85, 2, 2, 1, false, 'Rio de Janeiro', 'Ipanema', 'RJ', 'Rua Visconde de Pirajß, 300, Ipanema, RJ', 'seed://rj-ipanema-001', 'seed', 'venda', 'apartamento', 'active', 93.0, -22.9870, -43.2003),
        ('Kitnet com vista mar em Copacabana', 'Kitnet reformada, vista parcial para o mar.', 680000, 40, 1, 1, 0, false, 'Rio de Janeiro', 'Copacabana', 'RJ', 'Av. AtlÔntica, 1500, Copacabana, RJ', 'seed://rj-copacabana-001', 'seed', 'venda', 'apartamento', 'active', 87.0, -22.9700, -43.1829),
        ('Apartamento 4 quartos na Barra da Tijuca', 'CondomÝnio clube, 4 suÝtes, piscina, quadra.', 1650000, 190, 4, 4, 3, true, 'Rio de Janeiro', 'Barra da Tijuca', 'RJ', 'Av. das AmÚricas, 3000, Barra da Tijuca, RJ', 'seed://rj-barra-001', 'seed', 'venda', 'apartamento', 'active', 89.0, -23.0029, -43.3652),
        
        -- Belo Horizonte
        ('Apartamento alto padrÒo na Savassi', 'Finamente acabado, localizaþÒo prime BH.', 920000, 110, 3, 3, 2, false, 'Belo Horizonte', 'Savassi', 'MG', 'Rua Pernambuco, 400, Savassi, BH', 'seed://bh-savassi-001', 'seed', 'venda', 'apartamento', 'active', 86.0, -19.9395, -43.9378),
        ('Apartamento 2 quartos no Lourdes', 'PrÚdio moderno, pr¾ximo a hospitais e comÚrcio.', 690000, 80, 2, 2, 1, true, 'Belo Horizonte', 'Lourdes', 'MG', 'Av. ┴lvares Cabral, 800, Lourdes, BH', 'seed://bh-lourdes-001', 'seed', 'venda', 'apartamento', 'active', 79.0, -19.9329, -43.9442)
        ON CONFLICT (source_url) DO NOTHING;

UPDATE properties
        SET location = ST_SetSRID(ST_MakePoint(lng::float8, lat::float8), 4326)
        WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;

UPDATE alembic_version SET version_num='09d1da6a1c6a' WHERE alembic_version.version_num = '947135247b5a';

-- Running upgrade 09d1da6a1c6a -> c1f3a8b2d9e4

DROP TRIGGER IF EXISTS trg_properties_sync_location ON properties;

DROP FUNCTION IF EXISTS trg_sync_location();

DROP INDEX IF EXISTS ix_properties_location_gist;

DROP TABLE IF EXISTS lead_activities CASCADE;

DROP TABLE IF EXISTS documents CASCADE;

DROP TABLE IF EXISTS comissoes CASCADE;

DROP TABLE IF EXISTS proposals CASCADE;

DROP TABLE IF EXISTS property_views CASCADE;

DROP TABLE IF EXISTS property_media CASCADE;

DROP TABLE IF EXISTS property_availability CASCADE;

DROP TABLE IF EXISTS property_assignments CASCADE;

DROP TABLE IF EXISTS mandates CASCADE;

DROP TABLE IF EXISTS favorites CASCADE;

DROP TABLE IF EXISTS leads CASCADE;

DROP TABLE IF EXISTS appointments CASCADE;

DROP TABLE IF EXISTS buyer_profiles CASCADE;

DROP TABLE IF EXISTS whatsapp_messages CASCADE;

DROP TABLE IF EXISTS whatsapp_sessions CASCADE;

DROP TABLE IF EXISTS properties CASCADE;

DROP TABLE IF EXISTS owners CASCADE;

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE usuarios (
    id SERIAL NOT NULL, 
    email VARCHAR NOT NULL, 
    senha_hash VARCHAR NOT NULL, 
    nome VARCHAR, 
    perfil VARCHAR, 
    tipo_plano VARCHAR, 
    plano_expira_em TIMESTAMP WITH TIME ZONE, 
    telefone VARCHAR, 
    creci VARCHAR, 
    ativo BOOLEAN, 
    imobiliaria_id INTEGER, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_usuarios PRIMARY KEY (id), 
    CONSTRAINT fk_usuarios_imobiliaria_id FOREIGN KEY(imobiliaria_id) REFERENCES usuarios (id), 
    CONSTRAINT ck_usuarios_ck_usuarios_perfil CHECK (perfil IN ('comprador','corretor','imobiliaria','admin')), 
    CONSTRAINT ck_usuarios_ck_usuarios_tipo_plano CHECK (tipo_plano IN ('gratuito','pro','premium'))
);

CREATE UNIQUE INDEX ix_usuarios_email ON usuarios (email);

CREATE INDEX ix_usuarios_id ON usuarios (id);

CREATE INDEX ix_usuarios_perfil ON usuarios (perfil);

CREATE INDEX ix_usuarios_tipo_plano ON usuarios (tipo_plano);

CREATE TABLE proprietarios (
    id SERIAL NOT NULL, 
    nome VARCHAR NOT NULL, 
    email VARCHAR, 
    telefone VARCHAR, 
    documento VARCHAR, 
    endereco VARCHAR, 
    observacoes TEXT, 
    corretor_id INTEGER, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_proprietarios PRIMARY KEY (id), 
    CONSTRAINT fk_proprietarios_corretor_id FOREIGN KEY(corretor_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_proprietarios_id ON proprietarios (id);

CREATE INDEX ix_proprietarios_email ON proprietarios (email);

CREATE TABLE imoveis (
    id SERIAL NOT NULL, 
    titulo VARCHAR NOT NULL, 
    descricao TEXT, 
    preco NUMERIC(15, 2) NOT NULL, 
    valor_aluguel NUMERIC(15, 2), 
    area NUMERIC(10, 2), 
    quartos INTEGER, 
    banheiros INTEGER, 
    vagas INTEGER, 
    aceita_financiamento BOOLEAN, 
    cidade VARCHAR, 
    bairro VARCHAR, 
    estado VARCHAR, 
    endereco_completo VARCHAR, 
    url_origem VARCHAR, 
    url_imagem VARCHAR, 
    origem VARCHAR, 
    tipo_oferta VARCHAR, 
    tipo_imovel VARCHAR, 
    situacao VARCHAR, 
    corretor_id INTEGER, 
    proprietario_id INTEGER, 
    percentual_comissao NUMERIC(5, 4), 
    pontuacao_mercado NUMERIC(5, 2), 
    atributos_extras JSON, 
    destaque BOOLEAN, 
    ultima_analise_em TIMESTAMP WITH TIME ZONE, 
    total_visualizacoes INTEGER DEFAULT '0', 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    latitude NUMERIC(10, 7), 
    longitude NUMERIC(10, 7), 
    CONSTRAINT pk_imoveis PRIMARY KEY (id), 
    CONSTRAINT fk_imoveis_corretor_id FOREIGN KEY(corretor_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_imoveis_proprietario_id FOREIGN KEY(proprietario_id) REFERENCES proprietarios (id), 
    CONSTRAINT uq_imoveis_url_origem UNIQUE (url_origem), 
    CONSTRAINT ck_imoveis_ck_imoveis_tipo_oferta CHECK (tipo_oferta IN ('venda','aluguel','temporada','ambos')), 
    CONSTRAINT ck_imoveis_ck_imoveis_tipo_imovel CHECK (tipo_imovel IN ('apartamento','casa','terreno','comercial','rural')), 
    CONSTRAINT ck_imoveis_ck_imoveis_situacao CHECK (situacao IN ('ativo','arquivado','pendente','vendido','alugado'))
);

CREATE INDEX ix_imoveis_id ON imoveis (id);

CREATE INDEX ix_imoveis_titulo ON imoveis (titulo);

CREATE INDEX ix_imoveis_preco ON imoveis (preco);

CREATE INDEX ix_imoveis_area ON imoveis (area);

CREATE INDEX ix_imoveis_quartos ON imoveis (quartos);

CREATE INDEX ix_imoveis_cidade ON imoveis (cidade);

CREATE INDEX ix_imoveis_bairro ON imoveis (bairro);

CREATE INDEX ix_imoveis_estado ON imoveis (estado);

CREATE INDEX ix_imoveis_tipo_oferta ON imoveis (tipo_oferta);

CREATE INDEX ix_imoveis_tipo_imovel ON imoveis (tipo_imovel);

CREATE INDEX ix_imoveis_situacao ON imoveis (situacao);

CREATE INDEX ix_imoveis_total_visualizacoes ON imoveis (total_visualizacoes);

CREATE INDEX ix_imoveis_criado_em ON imoveis (criado_em);

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS localizacao geometry(Point, 4326);

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
        $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_imoveis_sincronizar_localizacao ON imoveis;

CREATE TRIGGER trg_imoveis_sincronizar_localizacao
            BEFORE INSERT OR UPDATE OF latitude, longitude
            ON imoveis
            FOR EACH ROW
            EXECUTE FUNCTION trg_sincronizar_localizacao();

CREATE INDEX IF NOT EXISTS ix_imoveis_localizacao_gist ON imoveis USING gist(localizacao);

CREATE INDEX ix_imoveis_lat_lng ON imoveis (latitude, longitude);

CREATE TABLE perfis_comprador (
    id SERIAL NOT NULL, 
    usuario_id INTEGER NOT NULL, 
    nome_perfil VARCHAR, 
    preco_minimo NUMERIC(15, 2), 
    preco_maximo NUMERIC(15, 2), 
    cidade VARCHAR, 
    bairro VARCHAR, 
    tipo_imovel VARCHAR, 
    tipo_oferta VARCHAR, 
    quartos_minimo INTEGER, 
    banheiros_minimo INTEGER, 
    vagas_minimo INTEGER, 
    financiamento_aprovado BOOLEAN, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_perfis_comprador PRIMARY KEY (id), 
    CONSTRAINT fk_perfis_comprador_usuario_id FOREIGN KEY(usuario_id) REFERENCES usuarios (id), 
    CONSTRAINT uq_perfis_comprador_usuario UNIQUE (usuario_id)
);

CREATE INDEX ix_perfis_comprador_id ON perfis_comprador (id);

CREATE INDEX ix_perfis_comprador_usuario_id ON perfis_comprador (usuario_id);

CREATE TABLE sessoes_whatsapp (
    id SERIAL NOT NULL, 
    usuario_id INTEGER NOT NULL, 
    situacao VARCHAR, 
    conectado_em TIMESTAMP WITH TIME ZONE, 
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_sessoes_whatsapp PRIMARY KEY (id), 
    CONSTRAINT fk_sessoes_whatsapp_usuario_id FOREIGN KEY(usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_sessoes_whatsapp_id ON sessoes_whatsapp (id);

CREATE UNIQUE INDEX ix_sessoes_whatsapp_usuario_id ON sessoes_whatsapp (usuario_id);

CREATE TABLE mensagens_whatsapp (
    id SERIAL NOT NULL, 
    usuario_id INTEGER NOT NULL, 
    jid_conversa VARCHAR NOT NULL, 
    id_mensagem VARCHAR, 
    direcao VARCHAR NOT NULL, 
    conteudo TEXT NOT NULL, 
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_mensagens_whatsapp PRIMARY KEY (id), 
    CONSTRAINT fk_mensagens_whatsapp_usuario_id FOREIGN KEY(usuario_id) REFERENCES usuarios (id), 
    CONSTRAINT uq_mensagens_whatsapp_id_mensagem UNIQUE (id_mensagem)
);

CREATE INDEX ix_mensagens_whatsapp_id ON mensagens_whatsapp (id);

CREATE INDEX ix_mensagens_whatsapp_usuario_id ON mensagens_whatsapp (usuario_id);

CREATE INDEX ix_mensagens_whatsapp_jid_conversa ON mensagens_whatsapp (jid_conversa);

CREATE TABLE mandatos (
    id SERIAL NOT NULL, 
    imovel_id INTEGER, 
    proprietario_id INTEGER, 
    corretor_id INTEGER, 
    tipo VARCHAR, 
    percentual_comissao NUMERIC(5, 4), 
    exclusivo BOOLEAN, 
    data_vencimento TIMESTAMP WITH TIME ZONE, 
    situacao VARCHAR, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_mandatos PRIMARY KEY (id), 
    CONSTRAINT fk_mandatos_corretor_id FOREIGN KEY(corretor_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_mandatos_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT fk_mandatos_proprietario_id FOREIGN KEY(proprietario_id) REFERENCES proprietarios (id), 
    CONSTRAINT ck_mandatos_ck_mandatos_tipo CHECK (tipo IN ('venda','locacao')), 
    CONSTRAINT ck_mandatos_ck_mandatos_situacao CHECK (situacao IN ('ativo','expirado','rescindido'))
);

CREATE INDEX ix_mandatos_id ON mandatos (id);

CREATE UNIQUE INDEX ix_mandatos_imovel_ativo ON mandatos (imovel_id) WHERE situacao = 'ativo';

CREATE TABLE responsaveis_imovel (
    imovel_id INTEGER NOT NULL, 
    usuario_id INTEGER NOT NULL, 
    funcao VARCHAR, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_responsaveis_imovel PRIMARY KEY (imovel_id, usuario_id), 
    CONSTRAINT fk_responsaveis_imovel_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT fk_responsaveis_imovel_usuario_id FOREIGN KEY(usuario_id) REFERENCES usuarios (id)
);

CREATE TABLE disponibilidade_imovel (
    id SERIAL NOT NULL, 
    imovel_id INTEGER NOT NULL, 
    dia_semana INTEGER, 
    hora_inicio TIME WITHOUT TIME ZONE NOT NULL, 
    hora_fim TIME WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_disponibilidade_imovel PRIMARY KEY (id), 
    CONSTRAINT fk_disponibilidade_imovel_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT uq_disponibilidade_imovel_slot UNIQUE (imovel_id, dia_semana, hora_inicio), 
    CONSTRAINT ck_disponibilidade_imovel_ck_disponibilidade_horario_valido CHECK (hora_inicio < hora_fim)
);

CREATE INDEX ix_disponibilidade_imovel_id ON disponibilidade_imovel (id);

CREATE TABLE midias_imovel (
    id SERIAL NOT NULL, 
    imovel_id INTEGER NOT NULL, 
    tipo_midia VARCHAR, 
    url VARCHAR, 
    ordem INTEGER DEFAULT '0', 
    CONSTRAINT pk_midias_imovel PRIMARY KEY (id), 
    CONSTRAINT fk_midias_imovel_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT ck_midias_imovel_ck_midias_imovel_tipo_midia CHECK (tipo_midia IN ('imagem','video','tour_virtual'))
);

CREATE INDEX ix_midias_imovel_id ON midias_imovel (id);

CREATE TABLE visualizacoes_imovel (
    id SERIAL NOT NULL, 
    usuario_id INTEGER NOT NULL, 
    imovel_id INTEGER NOT NULL, 
    visualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_visualizacoes_imovel PRIMARY KEY (id), 
    CONSTRAINT fk_visualizacoes_imovel_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT fk_visualizacoes_imovel_usuario_id FOREIGN KEY(usuario_id) REFERENCES usuarios (id), 
    CONSTRAINT uq_visualizacoes_usuario_imovel UNIQUE (usuario_id, imovel_id)
);

CREATE INDEX ix_visualizacoes_imovel_id ON visualizacoes_imovel (id);

CREATE INDEX ix_visualizacoes_imovel_usuario_id ON visualizacoes_imovel (usuario_id);

CREATE INDEX ix_visualizacoes_imovel_imovel_id ON visualizacoes_imovel (imovel_id);

CREATE TABLE favoritos (
    id SERIAL NOT NULL, 
    usuario_id INTEGER NOT NULL, 
    imovel_id INTEGER NOT NULL, 
    nivel_interesse INTEGER, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_favoritos PRIMARY KEY (id), 
    CONSTRAINT fk_favoritos_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT fk_favoritos_usuario_id FOREIGN KEY(usuario_id) REFERENCES usuarios (id), 
    CONSTRAINT uq_favoritos_usuario_imovel UNIQUE (usuario_id, imovel_id), 
    CONSTRAINT ck_favoritos_ck_favoritos_nivel_interesse CHECK (nivel_interesse BETWEEN 1 AND 5)
);

CREATE INDEX ix_favoritos_id ON favoritos (id);

CREATE TABLE leads (
    id SERIAL NOT NULL, 
    imovel_id INTEGER, 
    corretor_id INTEGER, 
    nome VARCHAR NOT NULL, 
    email VARCHAR, 
    telefone VARCHAR, 
    origem VARCHAR, 
    situacao VARCHAR, 
    observacoes TEXT, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_leads PRIMARY KEY (id), 
    CONSTRAINT fk_leads_corretor_id FOREIGN KEY(corretor_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_leads_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT ck_leads_ck_leads_situacao CHECK (situacao IN ('novo','contatado','visita','proposta','fechado','perdido'))
);

CREATE INDEX ix_leads_id ON leads (id);

CREATE TABLE atividades_lead (
    id SERIAL NOT NULL, 
    lead_id INTEGER NOT NULL, 
    usuario_id INTEGER, 
    tipo_atividade VARCHAR, 
    descricao TEXT, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_atividades_lead PRIMARY KEY (id), 
    CONSTRAINT fk_atividades_lead_lead_id FOREIGN KEY(lead_id) REFERENCES leads (id), 
    CONSTRAINT fk_atividades_lead_usuario_id FOREIGN KEY(usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_atividades_lead_id ON atividades_lead (id);

CREATE TABLE agendamentos (
    id SERIAL NOT NULL, 
    imovel_id INTEGER NOT NULL, 
    corretor_id INTEGER, 
    comprador_id INTEGER, 
    nome_visitante VARCHAR NOT NULL, 
    telefone_visitante VARCHAR NOT NULL, 
    data_visita TIMESTAMP WITH TIME ZONE NOT NULL, 
    data_fim_visita TIMESTAMP WITH TIME ZONE, 
    situacao VARCHAR, 
    observacoes TEXT, 
    feedback_visita TEXT, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_agendamentos PRIMARY KEY (id), 
    CONSTRAINT fk_agendamentos_comprador_id FOREIGN KEY(comprador_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_agendamentos_corretor_id FOREIGN KEY(corretor_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_agendamentos_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT ck_agendamentos_ck_agendamentos_situacao CHECK (situacao IN ('pendente','confirmado','cancelado','realizado')), 
    CONSTRAINT ck_agendamentos_ck_agendamentos_horario_valido CHECK (data_fim_visita IS NULL OR data_fim_visita > data_visita)
);

CREATE INDEX ix_agendamentos_id ON agendamentos (id);

CREATE TABLE propostas (
    id SERIAL NOT NULL, 
    imovel_id INTEGER NOT NULL, 
    comprador_id INTEGER, 
    nome_comprador VARCHAR NOT NULL, 
    email_comprador VARCHAR, 
    telefone_comprador VARCHAR, 
    valor_ofertado NUMERIC(15, 2) NOT NULL, 
    forma_pagamento VARCHAR, 
    percentual_financiamento NUMERIC(5, 2), 
    condicoes VARCHAR, 
    mensagem VARCHAR, 
    situacao VARCHAR, 
    corretor_id INTEGER, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_propostas PRIMARY KEY (id), 
    CONSTRAINT fk_propostas_comprador_id FOREIGN KEY(comprador_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_propostas_corretor_id FOREIGN KEY(corretor_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_propostas_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT ck_propostas_ck_propostas_situacao CHECK (situacao IN ('pendente','visualizada','encaminhada','aceita','recusada','contraproposta')), 
    CONSTRAINT ck_propostas_ck_propostas_forma_pagamento CHECK (forma_pagamento IN ('avista','financiamento','misto'))
);

CREATE INDEX ix_propostas_id ON propostas (id);

CREATE INDEX ix_propostas_imovel_id ON propostas (imovel_id);

CREATE INDEX ix_propostas_comprador_id ON propostas (comprador_id);

CREATE INDEX ix_propostas_situacao ON propostas (situacao);

CREATE TABLE comissoes (
    id SERIAL NOT NULL, 
    proposta_id INTEGER, 
    imovel_id INTEGER NOT NULL, 
    corretor_id INTEGER NOT NULL, 
    imobiliaria_id INTEGER, 
    valor_imovel NUMERIC(15, 2) NOT NULL, 
    percentual NUMERIC(5, 4) NOT NULL, 
    valor_comissao NUMERIC(15, 2) NOT NULL, 
    situacao_pagamento VARCHAR, 
    observacoes VARCHAR, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE, 
    pago_em TIMESTAMP WITH TIME ZONE, 
    CONSTRAINT pk_comissoes PRIMARY KEY (id), 
    CONSTRAINT fk_comissoes_corretor_id FOREIGN KEY(corretor_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_comissoes_imobiliaria_id FOREIGN KEY(imobiliaria_id) REFERENCES usuarios (id), 
    CONSTRAINT fk_comissoes_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT fk_comissoes_proposta_id FOREIGN KEY(proposta_id) REFERENCES propostas (id), 
    CONSTRAINT ck_comissoes_ck_comissoes_situacao_pagamento CHECK (situacao_pagamento IN ('pendente','pago','cancelado'))
);

CREATE INDEX ix_comissoes_id ON comissoes (id);

CREATE INDEX ix_comissoes_imovel_id ON comissoes (imovel_id);

CREATE INDEX ix_comissoes_corretor_id ON comissoes (corretor_id);

CREATE INDEX ix_comissoes_proposta_id ON comissoes (proposta_id);

CREATE INDEX ix_comissoes_situacao_pagamento ON comissoes (situacao_pagamento);

CREATE TABLE documentos (
    id SERIAL NOT NULL, 
    titulo VARCHAR NOT NULL, 
    tipo_documento VARCHAR NOT NULL, 
    descricao VARCHAR, 
    nome_arquivo VARCHAR, 
    url_arquivo VARCHAR, 
    tamanho_bytes BIGINT, 
    situacao VARCHAR, 
    enviado_por INTEGER NOT NULL, 
    imovel_id INTEGER, 
    proposta_id INTEGER, 
    observacoes VARCHAR, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    CONSTRAINT pk_documentos PRIMARY KEY (id), 
    CONSTRAINT fk_documentos_enviado_por FOREIGN KEY(enviado_por) REFERENCES usuarios (id), 
    CONSTRAINT fk_documentos_imovel_id FOREIGN KEY(imovel_id) REFERENCES imoveis (id), 
    CONSTRAINT fk_documentos_proposta_id FOREIGN KEY(proposta_id) REFERENCES propostas (id), 
    CONSTRAINT ck_documentos_ck_documentos_situacao CHECK (situacao IN ('rascunho','pendente_assinatura','assinado','arquivado'))
);

CREATE INDEX ix_documentos_id ON documentos (id);

CREATE INDEX ix_documentos_tipo_documento ON documentos (tipo_documento);

CREATE INDEX ix_documentos_imovel_id ON documentos (imovel_id);

CREATE INDEX ix_documentos_proposta_id ON documentos (proposta_id);

CREATE INDEX ix_documentos_situacao ON documentos (situacao);

CREATE INDEX ix_documentos_enviado_por ON documentos (enviado_por);

INSERT INTO imoveis (
            titulo, descricao, preco, area, quartos, banheiros, vagas,
            aceita_financiamento, cidade, bairro, estado, endereco_completo,
            url_origem, origem, tipo_oferta, tipo_imovel, situacao,
            pontuacao_mercado, latitude, longitude
        ) VALUES
        ('Apartamento moderno em Pinheiros', 'Amplo 2 quartos pr¾ximo ao metr¶, varanda gourmet.', 650000, 75, 2, 2, 1, true, 'SÒo Paulo', 'Pinheiros', 'SP', 'Rua dos Pinheiros, 500, Pinheiros, SP', 'seed://sp-pinheiros-001', 'seed', 'venda', 'apartamento', 'ativo', 82.5, -23.5614, -46.6858),
        ('Studio charmoso na Vila Madalena', 'Studio reformado, pr¾ximo a bares e galerias.', 380000, 38, 1, 1, 0, true, 'SÒo Paulo', 'Vila Madalena', 'SP', 'Rua Harmonia, 120, Vila Madalena, SP', 'seed://sp-vilamadalena-001', 'seed', 'venda', 'apartamento', 'ativo', 75.0, -23.5537, -46.6907),
        ('Cobertura duplex nos Jardins', 'Cobertura luxuosa com terraþo e churrasqueira, 4 suÝtes.', 3200000, 280, 4, 4, 3, false, 'SÒo Paulo', 'Jardins', 'SP', 'Al. Santos, 1800, Jardins, SP', 'seed://sp-jardins-001', 'seed', 'venda', 'apartamento', 'ativo', 95.0, -23.5673, -46.6575),
        ('Apartamento 3 quartos em Moema', 'Planta ampla, lazer completo, vaga dupla.', 1100000, 130, 3, 2, 2, true, 'SÒo Paulo', 'Moema', 'SP', 'Av. Ibirapuera, 2000, Moema, SP', 'seed://sp-moema-001', 'seed', 'venda', 'apartamento', 'ativo', 88.0, -23.6000, -46.6644),
        ('Flat executivo no Brooklin', 'Flat com serviþos de hotel, ideal para executivos.', 520000, 55, 1, 1, 1, false, 'SÒo Paulo', 'Brooklin', 'SP', 'Av. Engenheiro LuÝs Carlos Berrini, 300, Brooklin, SP', 'seed://sp-brooklin-001', 'seed', 'venda', 'apartamento', 'ativo', 78.5, -23.6165, -46.6979),
        ('Apartamento garden no Itaim Bibi', 'Garden com piscina privativa, condomÝnio de alto padrÒo.', 2400000, 200, 3, 3, 2, false, 'SÒo Paulo', 'Itaim Bibi', 'SP', 'Rua Joaquim Floriano, 850, Itaim Bibi, SP', 'seed://sp-itaim-001', 'seed', 'venda', 'apartamento', 'ativo', 91.0, -23.5865, -46.6802),
        ('Casa sobrado na Lapa', 'Sobrado 4 quartos com quintal, rua tranquila.', 870000, 180, 4, 3, 2, true, 'SÒo Paulo', 'Lapa', 'SP', 'Rua Guaicurus, 400, Lapa, SP', 'seed://sp-lapa-001', 'seed', 'venda', 'casa', 'ativo', 70.0, -23.5225, -46.7093),
        ('Apartamento 2 quartos em Santana', 'PrÚdio novo com academia e salÒo de festas.', 420000, 65, 2, 1, 1, true, 'SÒo Paulo', 'Santana', 'SP', 'Av. Braz Leme, 1500, Santana, SP', 'seed://sp-santana-001', 'seed', 'venda', 'apartamento', 'ativo', 68.0, -23.4947, -46.6297),
        ('Apartamento compacto no TatuapÚ', 'Bem localizado, pr¾ximo ao metr¶ TatuapÚ.', 395000, 58, 2, 1, 1, true, 'SÒo Paulo', 'TatuapÚ', 'SP', 'Rua Serra de JairÚ, 200, TatuapÚ, SP', 'seed://sp-tatua-001', 'seed', 'venda', 'apartamento', 'ativo', 65.0, -23.5437, -46.5785),
        ('Apartamento 3 quartos em Perdizes', 'Metragem generosa, cozinha americana, 2 vagas.', 980000, 120, 3, 2, 2, true, 'SÒo Paulo', 'Perdizes', 'SP', 'Rua Ministro God¾i, 550, Perdizes, SP', 'seed://sp-perdizes-001', 'seed', 'venda', 'apartamento', 'ativo', 80.0, -23.5394, -46.6738),
        ('Studio na Bela Vista', 'Ëtimo para investimento, pr¾ximo Ó Paulista.', 330000, 35, 1, 1, 0, true, 'SÒo Paulo', 'Bela Vista', 'SP', 'Rua 13 de Maio, 300, Bela Vista, SP', 'seed://sp-belavista-001', 'seed', 'venda', 'apartamento', 'ativo', 72.0, -23.5611, -46.6490),
        ('Apartamento reformado na AclimaþÒo', 'Totalmente reformado, ambientes integrados.', 560000, 80, 2, 2, 1, true, 'SÒo Paulo', 'AclimaþÒo', 'SP', 'Rua Muniz de Souza, 100, AclimaþÒo, SP', 'seed://sp-aclimacao-001', 'seed', 'venda', 'apartamento', 'ativo', 76.0, -23.5750, -46.6320),
        ('Loft na ConsolaþÒo', 'Loft pÚ-direito duplo, muito iluminado.', 495000, 60, 1, 1, 0, false, 'SÒo Paulo', 'ConsolaþÒo', 'SP', 'Rua da ConsolaþÒo, 2000, ConsolaþÒo, SP', 'seed://sp-consolacao-001', 'seed', 'venda', 'apartamento', 'ativo', 74.0, -23.5530, -46.6530),
        ('Apartamento 3 quartos no Campo Belo', 'Lazer completo, andar alto, vista panorÔmica.', 1250000, 140, 3, 3, 2, false, 'SÒo Paulo', 'Campo Belo', 'SP', 'Av. Santo Amaro, 4500, Campo Belo, SP', 'seed://sp-campobelo-001', 'seed', 'venda', 'apartamento', 'ativo', 85.0, -23.6260, -46.6700),
        ('Casa no ButantÒ com amplo terreno', 'Oportunidade: terreno 300m▓, casa 2 quartos.', 750000, 120, 2, 2, 2, true, 'SÒo Paulo', 'ButantÒ', 'SP', 'Rua Alvarenga, 800, ButantÒ, SP', 'seed://sp-butanta-001', 'seed', 'venda', 'casa', 'ativo', 69.0, -23.5700, -46.7200),
        ('Apartamento 2 quartos em Ipanema', 'A 200m da praia, andar alto, ventilado.', 1800000, 85, 2, 2, 1, false, 'Rio de Janeiro', 'Ipanema', 'RJ', 'Rua Visconde de Pirajß, 300, Ipanema, RJ', 'seed://rj-ipanema-001', 'seed', 'venda', 'apartamento', 'ativo', 93.0, -22.9870, -43.2003),
        ('Kitnet com vista mar em Copacabana', 'Kitnet reformada, vista parcial para o mar.', 680000, 40, 1, 1, 0, false, 'Rio de Janeiro', 'Copacabana', 'RJ', 'Av. AtlÔntica, 1500, Copacabana, RJ', 'seed://rj-copacabana-001', 'seed', 'venda', 'apartamento', 'ativo', 87.0, -22.9700, -43.1829),
        ('Apartamento 4 quartos na Barra da Tijuca', 'CondomÝnio clube, 4 suÝtes, piscina, quadra.', 1650000, 190, 4, 4, 3, true, 'Rio de Janeiro', 'Barra da Tijuca', 'RJ', 'Av. das AmÚricas, 3000, Barra da Tijuca, RJ', 'seed://rj-barra-001', 'seed', 'venda', 'apartamento', 'ativo', 89.0, -23.0029, -43.3652),
        ('Apartamento alto padrÒo na Savassi', 'Finamente acabado, localizaþÒo prime BH.', 920000, 110, 3, 3, 2, false, 'Belo Horizonte', 'Savassi', 'MG', 'Rua Pernambuco, 400, Savassi, BH', 'seed://bh-savassi-001', 'seed', 'venda', 'apartamento', 'ativo', 86.0, -19.9395, -43.9378),
        ('Apartamento 2 quartos no Lourdes', 'PrÚdio moderno, pr¾ximo a hospitais e comÚrcio.', 690000, 80, 2, 2, 1, true, 'Belo Horizonte', 'Lourdes', 'MG', 'Av. ┴lvares Cabral, 800, Lourdes, BH', 'seed://bh-lourdes-001', 'seed', 'venda', 'apartamento', 'ativo', 79.0, -19.9329, -43.9442)
        ON CONFLICT (url_origem) DO NOTHING;

UPDATE imoveis
        SET localizacao = ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND localizacao IS NULL;

UPDATE alembic_version SET version_num='c1f3a8b2d9e4' WHERE alembic_version.version_num = '09d1da6a1c6a';

COMMIT;

