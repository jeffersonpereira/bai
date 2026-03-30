from sqlalchemy import Column, Integer, String, ForeignKey, Time
from sqlalchemy.orm import relationship
from app.db.database import Base

class PropertyAvailability(Base):
    __tablename__ = "property_availability"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    day_of_week = Column(Integer) # 0=Segunda, 6=Domingo
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Relações
    property = relationship("Property", back_populates="availability_windows")
