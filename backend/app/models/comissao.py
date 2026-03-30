from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Comissao(Base):
    """Gestão de comissões pagas a corretores e parceiros (spec: gestao_comissoes)."""
    __tablename__ = "comissoes"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    corretor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    agency_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    valor_imovel = Column(Float, nullable=False)
    percentual = Column(Float, nullable=False)  # Ex: 6.0
    valor_comissao = Column(Float, nullable=False)  # valor_imovel * percentual / 100

    # pendente | pago | cancelado
    status_pagamento = Column(String, default="pendente", index=True)
    observacoes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

    proposal = relationship("Proposal", foreign_keys=[proposal_id])
    property = relationship("Property", foreign_keys=[property_id])
    corretor = relationship("User", foreign_keys=[corretor_id])
    agency = relationship("User", foreign_keys=[agency_id])
