from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    area = Column(Float)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    garage_spaces = Column(Integer, default=0)
    financing_eligible = Column(Integer, default=0) # boolean via integer proxy no sqlite
    city = Column(String, index=True)
    neighborhood = Column(String, index=True)
    source_url = Column(String, unique=True)
    image_url = Column(String)
    source = Column(String)
    listing_type = Column(String, default="venda") # venda, aluguel, temporada
    property_type = Column(String, default="apartamento") # casa, apartamento, terreno, comercial
    status = Column(String, default="active") # active, archived, pending
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # O corretor/imobiliária
    actual_owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True) # O dono real do imóvel (cliente do corretor)
    commission_percentage = Column(Float, nullable=True) # Ex: 6.0
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="properties")
    actual_owner = relationship("Owner", back_populates="properties")
    mandate = relationship("Mandate", back_populates="property", uselist=False)
    leads = relationship("Lead", back_populates="property")
    favorited_by = relationship("Favorite", back_populates="property")
    assigned_brokers = relationship("User", secondary="property_assignments", back_populates="assigned_properties")
    media = relationship("PropertyMedia", back_populates="property", cascade="all, delete-orphan")
