"""
Script de seed para desenvolvimento.
- Limpa todos os dados das tabelas de negócio
- Cria um usuário por perfil com sufixo @bai.com.br e senha 12345678
- Cria 2 imóveis para corretor e 2 para imobiliaria
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash

engine = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

SENHA = "12345678"

USUARIOS = [
    {"email": "comprador@bai.com.br",  "nome": "João Comprador",    "perfil": "comprador"},
    {"email": "corretor@bai.com.br",   "nome": "Maria Corretor",    "perfil": "corretor"},
    {"email": "imobiliaria@bai.com.br","nome": "Imobiliária BAI",   "perfil": "imobiliaria"},
    {"email": "admin@bai.com.br",      "nome": "Admin BAI",         "perfil": "admin"},
]

IMOVEIS = [
    # Corretor
    {
        "titulo": "Apartamento 2 quartos em Pinheiros",
        "descricao": "Lindo apartamento reformado, próximo ao metrô, varanda gourmet.",
        "preco": 650000,
        "area": 72,
        "quartos": 2,
        "banheiros": 2,
        "vagas": 1,
        "cidade": "São Paulo",
        "bairro": "Pinheiros",
        "estado": "SP",
        "endereco_completo": "Rua dos Pinheiros, 500, Pinheiros, SP",
        "tipo_oferta": "venda",
        "tipo_imovel": "apartamento",
        "situacao": "ativo",
        "url_origem": "dev://corretor-imovel-001",
        "url_imagem": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        "corretor_email": "corretor@bai.com.br",
    },
    {
        "titulo": "Casa sobrado com quintal no Butantã",
        "descricao": "Espaçosa casa com 3 quartos, quintal amplo, churrasqueira.",
        "preco": 890000,
        "area": 180,
        "quartos": 3,
        "banheiros": 2,
        "vagas": 2,
        "cidade": "São Paulo",
        "bairro": "Butantã",
        "estado": "SP",
        "endereco_completo": "Rua Alvarenga, 800, Butantã, SP",
        "tipo_oferta": "venda",
        "tipo_imovel": "casa",
        "situacao": "ativo",
        "url_origem": "dev://corretor-imovel-002",
        "url_imagem": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        "corretor_email": "corretor@bai.com.br",
    },
    # Imobiliária
    {
        "titulo": "Cobertura duplex nos Jardins",
        "descricao": "Cobertura luxuosa com terraço, churrasqueira, 4 suítes e vista panorâmica.",
        "preco": 3200000,
        "area": 280,
        "quartos": 4,
        "banheiros": 4,
        "vagas": 3,
        "cidade": "São Paulo",
        "bairro": "Jardins",
        "estado": "SP",
        "endereco_completo": "Al. Santos, 1800, Jardins, SP",
        "tipo_oferta": "venda",
        "tipo_imovel": "apartamento",
        "situacao": "ativo",
        "url_origem": "dev://imobiliaria-imovel-001",
        "url_imagem": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        "corretor_email": "imobiliaria@bai.com.br",
    },
    {
        "titulo": "Apartamento 3 quartos na Savassi - BH",
        "descricao": "Finamente acabado em localização prime de Belo Horizonte.",
        "preco": 920000,
        "area": 110,
        "quartos": 3,
        "banheiros": 3,
        "vagas": 2,
        "cidade": "Belo Horizonte",
        "bairro": "Savassi",
        "estado": "MG",
        "endereco_completo": "Rua Pernambuco, 400, Savassi, BH",
        "tipo_oferta": "venda",
        "tipo_imovel": "apartamento",
        "situacao": "ativo",
        "url_origem": "dev://imobiliaria-imovel-002",
        "url_imagem": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
        "corretor_email": "imobiliaria@bai.com.br",
    },
]


def clear_data():
    print("Limpando dados...")
    candidates = [
        "whatsapp_sessions",
        "documentos",
        "comissoes",
        "visualizacoes_imovel",
        "midias",
        "atividades",
        "responsaveis_imovel",
        "perfis_comprador",
        "disponibilidades",
        "agendamentos",
        "propostas",
        "leads",
        "favoritos",
        "mandatos",
        "imoveis",
        "proprietarios",
        "usuarios",
    ]
    existing = {
        row[0]
        for row in db.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        ).fetchall()
    }
    for t in candidates:
        if t not in existing:
            print(f"  - {t} (nao existe, pulando)")
            continue
        try:
            db.execute(text(f"TRUNCATE {t} CASCADE"))
            print(f"  OK {t}")
        except Exception as e:
            db.rollback()
            print(f"  ERRO {t}: {e}")
    db.commit()
    print("Dados limpos.\n")


def create_users() -> dict[str, int]:
    print("Criando usuários...")
    user_ids: dict[str, int] = {}
    senha_hash = get_password_hash(SENHA)
    for u in USUARIOS:
        db.execute(
            text(
                "INSERT INTO usuarios (email, senha_hash, nome, perfil, ativo) "
                "VALUES (:email, :senha_hash, :nome, :perfil, true) "
                "RETURNING id"
            ),
            {
                "email": u["email"],
                "senha_hash": senha_hash,
                "nome": u["nome"],
                "perfil": u["perfil"],
            },
        )
        row = db.execute(
            text("SELECT id FROM usuarios WHERE email = :email"),
            {"email": u["email"]},
        ).fetchone()
        user_ids[u["email"]] = row[0]
        print(f"  OK {u['perfil']:15} {u['email']}")
    db.commit()
    print()
    return user_ids


def create_imoveis(user_ids: dict[str, int]):
    print("Criando imóveis...")
    for im in IMOVEIS:
        corretor_id = user_ids[im["corretor_email"]]
        db.execute(
            text(
                """
                INSERT INTO imoveis (
                    titulo, descricao, preco, area, quartos, banheiros, vagas,
                    cidade, bairro, estado, endereco_completo,
                    tipo_oferta, tipo_imovel, situacao,
                    corretor_id, url_origem, url_imagem
                ) VALUES (
                    :titulo, :descricao, :preco, :area, :quartos, :banheiros, :vagas,
                    :cidade, :bairro, :estado, :endereco_completo,
                    :tipo_oferta, :tipo_imovel, :situacao,
                    :corretor_id, :url_origem, :url_imagem
                )
                """
            ),
            {
                "titulo": im["titulo"],
                "descricao": im["descricao"],
                "preco": im["preco"],
                "area": im["area"],
                "quartos": im["quartos"],
                "banheiros": im["banheiros"],
                "vagas": im["vagas"],
                "cidade": im["cidade"],
                "bairro": im["bairro"],
                "estado": im["estado"],
                "endereco_completo": im["endereco_completo"],
                "tipo_oferta": im["tipo_oferta"],
                "tipo_imovel": im["tipo_imovel"],
                "situacao": im["situacao"],
                "corretor_id": corretor_id,
                "url_origem": im["url_origem"],
                "url_imagem": im["url_imagem"],
            },
        )
        print(f"  OK [{im['corretor_email'].split('@')[0]:13}] {im['titulo']}")
    db.commit()
    print()


def main():
    print("=" * 60)
    print("BAI - Seed de desenvolvimento")
    print("=" * 60)
    print()
    clear_data()
    user_ids = create_users()
    create_imoveis(user_ids)

    print("=" * 60)
    print("Seed concluído! Credenciais:")
    print("=" * 60)
    for u in USUARIOS:
        print(f"  {u['perfil']:15} {u['email']}  /  {SENHA}")
    print()


if __name__ == "__main__":
    main()
