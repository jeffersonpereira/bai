from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Proposta(Base):
    __tablename__ = "propostas"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=False, index=True)
    comprador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)

    # Dados do comprador (preenchidos manualmente quando não possui conta)
    nome_comprador = Column(String, nullable=False)
    email_comprador = Column(String, nullable=True)
    telefone_comprador = Column(String, nullable=True)

    valor_ofertado = Column(Numeric(15, 2), nullable=False)
    forma_pagamento = Column(String, default="financiamento")  # avista, financiamento, misto
    percentual_financiamento = Column(Numeric(5, 2), nullable=True)
    condicoes = Column(String, nullable=True)
    mensagem = Column(String, nullable=True)

    situacao = Column(String, default="pendente", index=True)
    # pendente | visualizada | encaminhada | aceita | recusada | contraproposta
    corretor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    imovel = relationship("Imovel", foreign_keys=[imovel_id])
    comprador = relationship("Usuario", foreign_keys=[comprador_id])
    corretor = relationship("Usuario", foreign_keys=[corretor_id])
