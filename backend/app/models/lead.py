from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), index=True)
    corretor_id = Column(Integer, ForeignKey("usuarios.id"), index=True)

    nome = Column(String, nullable=False)
    email = Column(String)
    telefone = Column(String)
    origem = Column(String)    # marketplace, site, indicacao, whatsapp
    situacao = Column(String, default="novo")  # novo, contatado, visita, proposta, fechado, perdido
    observacoes = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    imovel = relationship("Imovel", back_populates="leads")
    corretor = relationship("Usuario", back_populates="leads")
    atividades = relationship("AtividadeLead", back_populates="lead", cascade="all, delete-orphan")
