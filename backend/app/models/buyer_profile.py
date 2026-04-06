from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String, default="Meu Perfil")
    
    # Range de preços
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    
    # Localização
    city = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    
    # Tipo do imóvel e transação
    property_type = Column(String, nullable=True) # Ex: apartamento, casa
    listing_type = Column(String, default="venda") # Ex: venda, aluguel
    
    # Características mínimas
    min_bedrooms = Column(Integer, nullable=True)
    min_bathrooms = Column(Integer, nullable=True)
    min_garage_spaces = Column(Integer, nullable=True)
    
    # Capacidade do cliente
    financing_approved = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="buyer_profiles")
