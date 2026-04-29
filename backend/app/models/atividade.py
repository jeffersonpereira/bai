from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class AtividadeLead(Base):
    __tablename__ = "atividades_lead"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo_atividade = Column(String)  # ligacao, visita, proposta, comentario, email
    descricao = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="atividades")
    usuario = relationship("Usuario")
