from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Mandato(Base):
    __tablename__ = "mandatos"
    __table_args__ = (
        # Garante que um imóvel não tenha dois mandatos ativos simultaneamente
        Index("ix_mandatos_imovel_ativo", "imovel_id", unique=True,
              postgresql_where="situacao = 'ativo'"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"))
    proprietario_id = Column(Integer, ForeignKey("proprietarios.id"))
    corretor_id = Column(Integer, ForeignKey("usuarios.id"))

    tipo = Column(String)               # venda, locacao
    percentual_comissao = Column(Numeric(5, 4))
    exclusivo = Column(Boolean, default=False)
    data_vencimento = Column(DateTime(timezone=True))
    situacao = Column(String, default="ativo")  # ativo, expirado, rescindido
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    imovel = relationship("Imovel", back_populates="mandato")
    proprietario = relationship("Proprietario", back_populates="mandatos")
    corretor = relationship("Usuario", back_populates="mandatos")
