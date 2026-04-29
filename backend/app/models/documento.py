from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Documento(Base):
    __tablename__ = "documentos"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    tipo_documento = Column(String, nullable=False, index=True)
    # contrato | escritura | procuracao | rgi | laudo | cnh | comprovante_renda | outros
    descricao = Column(String, nullable=True)
    nome_arquivo = Column(String, nullable=True)
    url_arquivo = Column(String, nullable=True)
    tamanho_bytes = Column(BigInteger, nullable=True)
    situacao = Column(String, default="rascunho", index=True)
    # rascunho | pendente_assinatura | assinado | arquivado

    enviado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=True, index=True)
    proposta_id = Column(Integer, ForeignKey("propostas.id"), nullable=True, index=True)
    observacoes = Column(String, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    remetente = relationship("Usuario", foreign_keys=[enviado_por])
    imovel = relationship("Imovel", foreign_keys=[imovel_id])
    proposta = relationship("Proposta", foreign_keys=[proposta_id])
