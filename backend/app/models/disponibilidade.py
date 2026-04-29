from sqlalchemy import Column, Integer, ForeignKey, Time, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base


class DisponibilidadeImovel(Base):
    __tablename__ = "disponibilidade_imovel"
    __table_args__ = (
        UniqueConstraint("imovel_id", "dia_semana", "hora_inicio",
                         name="uq_disponibilidade_imovel_slot"),
        CheckConstraint("hora_inicio < hora_fim", name="ck_disponibilidade_horario_valido"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=False)
    dia_semana = Column(Integer)   # 0=Segunda … 6=Domingo
    hora_inicio = Column(Time, nullable=False)
    hora_fim = Column(Time, nullable=False)

    imovel = relationship("Imovel", back_populates="janelas_disponibilidade")
