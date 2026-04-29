from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class ResponsavelImovel(Base):
    __tablename__ = "responsaveis_imovel"

    imovel_id = Column(Integer, ForeignKey("imoveis.id"), primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), primary_key=True)
    funcao = Column(String, default="responsavel")
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
