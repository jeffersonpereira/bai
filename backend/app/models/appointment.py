from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    broker_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Corretor/Agência responsável
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Se o comprador estiver logado
    visitor_name = Column(String, nullable=False)
    visitor_phone = Column(String, nullable=False)
    visit_date = Column(DateTime(timezone=True), nullable=False) # Início
    visit_end_time = Column(DateTime(timezone=True), nullable=True) # Fim sugerido
    status = Column(String, default="pending") # pending, confirmed, cancelled, completed
    notes = Column(Text, nullable=True)
    feedback_visita = Column(Text, nullable=True)  # Feedback pós-visita (spec: feedback_visita)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relações
    property = relationship("Property", backref="appointments")
    broker = relationship("User", foreign_keys=[broker_id], backref="broker_appointments")
    buyer = relationship("User", foreign_keys=[buyer_id], backref="buyer_appointments")
