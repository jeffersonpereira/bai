from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.db.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    nome = Column(String)
    perfil = Column(String, default="comprador", index=True)  # comprador, corretor, imobiliaria, admin
    tipo_plano = Column(String, default="gratuito", index=True)  # gratuito, pro, premium
    plano_expira_em = Column(DateTime(timezone=True), nullable=True)
    telefone = Column(String, nullable=True)
    creci = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    imobiliaria_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Landing page pública (planos pro/premium)
    slug = Column(String(100), unique=True, index=True, nullable=True)
    bio = Column(Text, nullable=True)
    foto_perfil_url = Column(String(500), nullable=True)
    cor_primaria = Column(String(7), default="#1d4ed8")
    cor_secundaria = Column(String(7), default="#1e293b")
    redes_sociais = Column(JSON, nullable=True)
    landing_ativa = Column(Boolean, default=False)

    corretores = relationship("Usuario", backref=backref("imobiliaria", remote_side=[id]))

    imoveis = relationship("Imovel", back_populates="corretor")
    proprietarios = relationship("Proprietario", back_populates="corretor")
    mandatos = relationship("Mandato", back_populates="corretor")
    leads = relationship("Lead", back_populates="corretor")
    favoritos = relationship("Favorito", back_populates="usuario")
    imoveis_atribuidos = relationship(
        "Imovel",
        secondary="responsaveis_imovel",
        primaryjoin="Usuario.id == ResponsavelImovel.usuario_id",
        secondaryjoin="Imovel.id == ResponsavelImovel.imovel_id",
        back_populates="corretores_atribuidos",
        overlaps="corretores_atribuidos",
    )
    perfis_comprador = relationship("PerfilComprador", back_populates="usuario")
