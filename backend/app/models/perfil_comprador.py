from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class PerfilComprador(Base):
    __tablename__ = "perfis_comprador"
    __table_args__ = (
        UniqueConstraint("usuario_id", name="uq_perfis_comprador_usuario"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    nome_perfil = Column(String, default="Meu Perfil")

    preco_minimo = Column(Numeric(15, 2), nullable=True)
    preco_maximo = Column(Numeric(15, 2), nullable=True)

    cidade = Column(String, nullable=True)
    bairro = Column(String, nullable=True)

    tipo_imovel = Column(String, nullable=True)   # apartamento, casa, terreno, comercial
    tipo_oferta = Column(String, default="venda")  # venda, aluguel

    quartos_minimo = Column(Integer, nullable=True)
    banheiros_minimo = Column(Integer, nullable=True)
    vagas_minimo = Column(Integer, nullable=True)

    financiamento_aprovado = Column(Boolean, default=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    usuario = relationship("Usuario", back_populates="perfis_comprador")
