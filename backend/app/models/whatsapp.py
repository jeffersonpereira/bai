from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class WhatsAppSession(Base):
    __tablename__ = "whatsapp_sessions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    status = Column(String, default="disconnected")
    connected_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    chat_jid = Column(String, nullable=False, index=True)
    message_id = Column(String, nullable=True, unique=True)
    direction = Column(String, nullable=False)  # "in" or "out"
    body = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
