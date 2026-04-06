from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, index=True)
    phone = Column(String)
    document = Column(String)  # CPF/CNPJ
    address = Column(String)
    notes = Column(String)
    broker_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    broker = relationship("User", back_populates="owners")
    properties = relationship("Property", back_populates="actual_owner")
    mandates = relationship("Mandate", back_populates="owner")
