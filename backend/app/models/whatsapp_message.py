from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), index=True)
    body = Column(String, nullable=False)
    direction = Column(String, default="inbound") # inbound ou outbound
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    lead = relationship("Lead", back_populates="whatsapp_messages")
