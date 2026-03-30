from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class PropertyAssignment(Base):
    __tablename__ = "property_assignments"
    
    property_id = Column(Integer, ForeignKey("properties.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role = Column(String, default="responsavel")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
