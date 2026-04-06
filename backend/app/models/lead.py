from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    broker_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    source = Column(String)  # marketplace, site, indicacao
    status = Column(String, default="novo")  # novo, contatado, visita, proposta, fechado, perdido
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="leads")
    broker = relationship("User", back_populates="leads")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
