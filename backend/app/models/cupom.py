from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum as SAEnum
from app.db.database import Base
import enum


class TipoDesconto(str, enum.Enum):
    percentual = "percentual"
    fixo = "fixo"


class Cupom(Base):
    __tablename__ = "cupons"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    tipo_desconto = Column(SAEnum(TipoDesconto), nullable=False, default=TipoDesconto.percentual)
    valor_desconto = Column(Float, nullable=False)        # % ou R$ fixo
    valido_ate = Column(DateTime(timezone=True), nullable=True)   # None = sem expiração
    usos_max = Column(Integer, nullable=True)              # None = ilimitado
    usos_atual = Column(Integer, nullable=False, default=0)
    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc))
