from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Pagamento(Base):
    __tablename__ = "pagamentos"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    gateway = Column(String(50), nullable=False)          # stripe | pagarme | mercadopago | manual
    valor_centavos = Column(Integer, nullable=False)      # centavos de BRL
    moeda = Column(String(3), default="BRL")
    status = Column(String(30), default="pendente", index=True)  # pendente | aprovado | falhou | cancelado
    plano_contratado = Column(String(20), nullable=False) # pro | premium
    ciclo = Column(String(10), nullable=False)            # mensal | anual
    referencia_externa = Column(String(255), index=True)  # subscription ID do gateway
    customer_id_externo = Column(String(255))             # customer/payer ID do gateway
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario", foreign_keys=[usuario_id])
