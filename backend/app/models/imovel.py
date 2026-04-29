from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Numeric, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Imovel(Base):
    __tablename__ = "imoveis"
    __table_args__ = (
        Index("ix_imoveis_lat_lng", "latitude", "longitude"),
        {"extend_existing": True}
    )

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True, nullable=False)
    descricao = Column(Text)
    preco = Column(Numeric(15, 2), nullable=False, index=True)
    valor_aluguel = Column(Numeric(15, 2), nullable=True)
    area = Column(Numeric(10, 2), index=True)
    quartos = Column(Integer, index=True)
    banheiros = Column(Integer)
    vagas = Column(Integer, default=0)
    aceita_financiamento = Column(Boolean, default=False)
    cidade = Column(String, index=True)
    bairro = Column(String, index=True)
    estado = Column(String, index=True, nullable=True)
    endereco_completo = Column(String)
    url_origem = Column(String, unique=True)
    url_imagem = Column(String)
    origem = Column(String)
    tipo_oferta = Column(String, default="venda", index=True)      # venda, aluguel, temporada
    tipo_imovel = Column(String, default="apartamento", index=True) # casa, apartamento, terreno, comercial, rural
    situacao = Column(String, default="ativo", index=True)          # ativo, arquivado, pendente, vendido, alugado
    corretor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    proprietario_id = Column(Integer, ForeignKey("proprietarios.id"), nullable=True)
    percentual_comissao = Column(Numeric(5, 4), nullable=True)
    pontuacao_mercado = Column(Numeric(5, 2), default=0)
    atributos_extras = Column(JSON, nullable=True)
    destaque = Column(Boolean, default=False)
    ultima_analise_em = Column(DateTime(timezone=True), nullable=True)
    total_visualizacoes = Column(Integer, default=0, server_default="0", index=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    # coluna `localizacao geometry(Point,4326)` gerenciada por trigger PostgreSQL (PostGIS)

    corretor = relationship("Usuario", back_populates="imoveis")
    proprietario = relationship("Proprietario", back_populates="imoveis")
    mandato = relationship("Mandato", back_populates="imovel", uselist=False)
    leads = relationship("Lead", back_populates="imovel")
    favoritos = relationship("Favorito", back_populates="imovel")
    corretores_atribuidos = relationship(
        "Usuario",
        secondary="responsaveis_imovel",
        primaryjoin="Imovel.id == ResponsavelImovel.imovel_id",
        secondaryjoin="Usuario.id == ResponsavelImovel.usuario_id",
        back_populates="imoveis_atribuidos",
        overlaps="imoveis_atribuidos",
    )
    midias = relationship("MidiaImovel", back_populates="imovel", cascade="all, delete-orphan")
    janelas_disponibilidade = relationship(
        "DisponibilidadeImovel", back_populates="imovel", cascade="all, delete-orphan"
    )
