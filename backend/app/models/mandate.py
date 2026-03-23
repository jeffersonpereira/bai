from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.database import Base

class Mandate(Base):
    __tablename__ = "mandates"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    owner_id = Column(Integer, ForeignKey("owners.id"))
    broker_id = Column(Integer, ForeignKey("users.id"))
    
    type = Column(String)  # venda, locação
    commission_percentage = Column(Float)  # Ex: 6.0
    is_exclusive = Column(Boolean, default=False)
    expiry_date = Column(DateTime)
    status = Column(String, default="active")  # active, expired, terminated
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="mandate")
    owner = relationship("Owner", back_populates="mandates")
    broker = relationship("User", back_populates="mandates")
