from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Comissao(Base):
    __tablename__ = "comissoes"

    id = Column(Integer, primary_key=True, index=True)
    proposta_id = Column(Integer, ForeignKey("propostas.id"), nullable=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=False, index=True)
    corretor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    imobiliaria_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    valor_imovel = Column(Numeric(15, 2), nullable=False)
    percentual = Column(Numeric(5, 4), nullable=False)
    valor_comissao = Column(Numeric(15, 2), nullable=False)

    # pendente | pago | cancelado
    situacao_pagamento = Column(String, default="pendente", index=True)
    observacoes = Column(String, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    pago_em = Column(DateTime(timezone=True), nullable=True)

    proposta = relationship("Proposta", foreign_keys=[proposta_id])
    imovel = relationship("Imovel", foreign_keys=[imovel_id])
    corretor = relationship("Usuario", foreign_keys=[corretor_id])
    imobiliaria = relationship("Usuario", foreign_keys=[imobiliaria_id])
