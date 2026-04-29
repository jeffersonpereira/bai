from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Proprietario(Base):
    __tablename__ = "proprietarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, index=True)
    telefone = Column(String)
    documento = Column(String)  # CPF ou CNPJ
    endereco = Column(String)
    observacoes = Column(Text)
    corretor_id = Column(Integer, ForeignKey("usuarios.id"))
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    corretor = relationship("Usuario", back_populates="proprietarios")
    imoveis = relationship("Imovel", back_populates="proprietario")
    mandatos = relationship("Mandato", back_populates="proprietario")
