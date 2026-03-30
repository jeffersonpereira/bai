from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String)
    role = Column(String, default="user", index=True) # user, broker, agency, admin
    phone = Column(String, nullable=True)
    creci = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamento para hierarquia Agência -> Corretores
    brokers = relationship("User", backref=backref("agency", remote_side=[id]))

    properties = relationship("Property", back_populates="owner")
    owners = relationship("Owner", back_populates="broker")
    mandates = relationship("Mandate", back_populates="broker")
    leads = relationship("Lead", back_populates="broker")
    favorites = relationship("Favorite", back_populates="user")
    assigned_properties = relationship(
        "Property", 
        secondary="property_assignments", 
        primaryjoin="User.id == PropertyAssignment.user_id",
        secondaryjoin="Property.id == PropertyAssignment.property_id",
        back_populates="assigned_brokers",
        overlaps="assigned_brokers"
    )
    buyer_profiles = relationship("BuyerProfile", back_populates="user")
