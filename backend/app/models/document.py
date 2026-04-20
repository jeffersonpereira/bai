from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {"extend_existing": True}

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, nullable=False)
    doc_type      = Column(String, nullable=False, index=True)
    # contrato | escritura | procuração | rgi | laudo | cnh | comprovante_renda | outros
    description   = Column(String, nullable=True)
    file_name     = Column(String, nullable=True)
    file_url      = Column(String, nullable=True)
    file_size     = Column(BigInteger, nullable=True)   # bytes
    status        = Column(String, default="rascunho", index=True)
    # rascunho | pendente_assinatura | assinado | arquivado

    uploaded_by   = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    property_id   = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    proposal_id   = Column(Integer, ForeignKey("proposals.id"), nullable=True, index=True)
    notes         = Column(String, nullable=True)

    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    uploader      = relationship("User",     foreign_keys=[uploaded_by])
    property      = relationship("Property", foreign_keys=[property_id])
    proposal      = relationship("Proposal", foreign_keys=[proposal_id])
