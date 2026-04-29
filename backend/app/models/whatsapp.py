from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class WhatsAppSession(Base):
    __tablename__ = "sessoes_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False, index=True)
    situacao = Column(String, default="desconectado")  # conectado, desconectado, qr_pendente
    conectado_em = Column(DateTime(timezone=True), nullable=True)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WhatsAppMessage(Base):
    __tablename__ = "mensagens_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    jid_conversa = Column(String, nullable=False, index=True)
    id_mensagem = Column(String, nullable=True, unique=True)
    direcao = Column(String, nullable=False)  # entrada, saida
    conteudo = Column(Text, nullable=False)
    enviado_em = Column(DateTime(timezone=True), server_default=func.now())
