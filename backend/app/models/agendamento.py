from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Agendamento(Base):
    __tablename__ = "agendamentos"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=False, index=True)
    corretor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)
    comprador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)
    nome_visitante = Column(String, nullable=False)
    telefone_visitante = Column(String, nullable=False)
    data_visita = Column(DateTime(timezone=True), nullable=False)
    data_fim_visita = Column(DateTime(timezone=True), nullable=True)
    situacao = Column(String, default="pendente")  # pendente, confirmado, cancelado, realizado
    observacoes = Column(Text, nullable=True)
    feedback_visita = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    imovel = relationship("Imovel", backref="agendamentos")
    corretor = relationship("Usuario", foreign_keys=[corretor_id], backref="agendamentos_corretor")
    comprador = relationship("Usuario", foreign_keys=[comprador_id], backref="agendamentos_comprador")
