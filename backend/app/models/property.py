from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Property(Base):
    __tablename__ = "properties"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False, index=True)
    area = Column(Float, index=True)
    bedrooms = Column(Integer, index=True)
    bathrooms = Column(Integer)
    garage_spaces = Column(Integer, default=0)
    financing_eligible = Column(Boolean, default=False)
    city = Column(String, index=True)
    neighborhood = Column(String, index=True)
    state = Column(String, index=True, nullable=True)
    full_address = Column(String)
    source_url = Column(String, unique=True)
    image_url = Column(String)
    source = Column(String)
    listing_type = Column(String, default="venda", index=True) # venda, aluguel, temporada
    property_type = Column(String, default="apartamento", index=True) # casa, apartamento, terreno, comercial
    status = Column(String, default="active", index=True) # active, archived, pending
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # O corretor/imobiliária
    actual_owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True) # O dono real do imóvel (cliente do corretor)
    commission_percentage = Column(Float, nullable=True) # Ex: 6.0
    market_score = Column(Float, default=0.0) # Pontuação de oportunidade 0-100
    valor_aluguel = Column(Float, nullable=True)  # Preço de aluguel separado do de venda
    atributos_extras = Column(JSON, nullable=True)  # Ex: {"piscina": true, "varanda": true, "academia": false}
    is_star = Column(Boolean, default=False) # Flag para "Oportunidade Estrela"
    last_analysis_at = Column(DateTime(timezone=True), nullable=True)
    views_count = Column(Integer, default=0, server_default="0", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    lat = Column(Numeric(10, 7), nullable=True)
    lng = Column(Numeric(10, 7), nullable=True)
    # coluna `location geometry(Point,4326)` gerenciada por trigger PostgreSQL (PostGIS)

    owner = relationship("User", back_populates="properties")
    actual_owner = relationship("Owner", back_populates="properties")
    mandate = relationship("Mandate", back_populates="property", uselist=False)
    leads = relationship("Lead", back_populates="property")
    favorited_by = relationship("Favorite", back_populates="property")
    assigned_brokers = relationship(
        "User", 
        secondary="property_assignments", 
        primaryjoin="Property.id == PropertyAssignment.property_id",
        secondaryjoin="User.id == PropertyAssignment.user_id",
        back_populates="assigned_properties",
        overlaps="assigned_properties"
    )
    media = relationship("PropertyMedia", back_populates="property", cascade="all, delete-orphan")
    availability_windows = relationship("PropertyAvailability", back_populates="property", cascade="all, delete-orphan")
