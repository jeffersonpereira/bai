from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    broker_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Corretor ou Agência responsável
    visitor_name = Column(String, nullable=False)
    visitor_phone = Column(String, nullable=False)
    visit_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="pending") # pending, confirmed, cancelled, completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relações
    property = relationship("Property", backref="appointments")
    broker = relationship("User", backref="appointments")
