from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class ConfiguracaoSistema(Base):
    __tablename__ = "configuracoes_sistema"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    chave = Column(String(100), unique=True, nullable=False, index=True)
    valor = Column(Text, nullable=True)
    descricao = Column(Text, nullable=True)
    # tipo: string | integer | boolean | json | secret
    tipo = Column(String(20), default="string")
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
