from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.db.database import Base


class Documento(Base):
    __tablename__ = "documentos"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    tipo_documento = Column(String, nullable=False, index=True)
    descricao = Column(String, nullable=True)
    nome_arquivo = Column(String, nullable=True)
    url_arquivo = Column(String, nullable=True)
    tamanho_bytes = Column(BigInteger, nullable=True)
    hash_sha256 = Column(String(64), nullable=True, index=True)

    situacao = Column(String, default="rascunho", index=True)
    # rascunho | pendente_assinatura | assinado | arquivado

    contexto = Column(String, default="operacional", index=True)
    # imovel | proprietario | operacional

    visibilidade = Column(String, default="interno")
    # interno | compartilhado | publico

    assinado_digitalmente = Column(Boolean, default=False)
    validade_em = Column(DateTime(timezone=True), nullable=True)

    # Versionamento: versao_numero=1 é o original; documento_origem_id aponta para o doc raiz
    versao_numero = Column(Integer, default=1)
    documento_origem_id = Column(Integer, ForeignKey("documentos.id"), nullable=True)

    tags = Column(JSON, nullable=True)  # list[str]
    observacoes = Column(String, nullable=True)

    enviado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=True, index=True)
    proprietario_id = Column(Integer, ForeignKey("proprietarios.id"), nullable=True, index=True)
    proposta_id = Column(Integer, ForeignKey("propostas.id"), nullable=True, index=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    remetente = relationship("Usuario", foreign_keys=[enviado_por])
    imovel = relationship("Imovel", foreign_keys=[imovel_id])
    proposta = relationship("Proposta", foreign_keys=[proposta_id])
    proprietario = relationship("Proprietario", foreign_keys=[proprietario_id])
    versoes = relationship(
        "Documento",
        foreign_keys=[documento_origem_id],
        backref=backref("origem", remote_side=[id]),
        lazy="dynamic",
    )
