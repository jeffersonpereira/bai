from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Proposal(Base):
    __tablename__ = "proposals"
    __table_args__ = {"extend_existing": True}

    id                  = Column(Integer, primary_key=True, index=True)
    property_id         = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    buyer_user_id       = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Dados do comprador (preenchidos manualmente se não tiver conta)
    buyer_name          = Column(String, nullable=False)
    buyer_email         = Column(String, nullable=True)
    buyer_phone         = Column(String, nullable=True)

    # Oferta
    proposed_price      = Column(Float, nullable=False)
    payment_method      = Column(String, default="financiamento")   # avista | financiamento | misto
    financing_percentage= Column(Float, nullable=True)              # % a financiar (0–100)
    conditions          = Column(String, nullable=True)             # Prazo de mudança, reformas, etc.
    message             = Column(String, nullable=True)             # Mensagem livre ao corretor/vendedor

    # Controle
    status      = Column(String, default="pendente", index=True)
    # pendente | visualizada | encaminhada | aceita | recusada | contraproposta
    broker_id   = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    property    = relationship("Property",  foreign_keys=[property_id])
    buyer       = relationship("User",      foreign_keys=[buyer_user_id])
    broker      = relationship("User",      foreign_keys=[broker_id])
