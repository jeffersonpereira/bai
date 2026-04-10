from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    body = Column(String, nullable=False)
    direction = Column(String, default="inbound")  # inbound | outbound
    message_id = Column(String, nullable=True, unique=True)  # WhatsApp messageId para deduplicação
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="whatsapp_messages")

    __table_args__ = (
        # Índice composto para busca rápida de histórico por lead ordenado por data
        Index("ix_whatsapp_messages_lead_id_timestamp", "lead_id", "timestamp"),
    )
