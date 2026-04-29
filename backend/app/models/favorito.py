from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Favorito(Base):
    __tablename__ = "favoritos"
    __table_args__ = (
        UniqueConstraint("usuario_id", "imovel_id", name="uq_favoritos_usuario_imovel"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=False, index=True)
    nivel_interesse = Column(Integer, default=3)  # 1-5
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", back_populates="favoritos")
    imovel = relationship("Imovel", back_populates="favoritos")
