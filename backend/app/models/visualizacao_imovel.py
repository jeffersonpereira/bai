from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class VisualizacaoImovel(Base):
    __tablename__ = "visualizacoes_imovel"
    __table_args__ = (
        UniqueConstraint("usuario_id", "imovel_id", name="uq_visualizacoes_usuario_imovel"),
    )

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=False, index=True)
    visualizado_em = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario")
    imovel = relationship("Imovel")
