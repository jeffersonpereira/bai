from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.documento import Documento
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoCriar, DocumentoAtualizar

VALID_TYPES = {
    "contrato", "escritura", "procuração", "rgi",
    "laudo", "cnh", "comprovante_renda", "outros",
}
VALID_STATUSES = {"rascunho", "pendente_assinatura", "assinado", "arquivado"}


def _check_access(doc: Documento, current_user: Usuario):
    if current_user.perfil in ("admin", "imobiliaria", "corretor"):
        return
    if doc.enviado_por != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar este documento")


def create_document(db: Session, doc_in: DocumentoCriar, current_user: Usuario) -> Documento:
    if doc_in.tipo_documento not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Válidos: {sorted(VALID_TYPES)}")
    if doc_in.situacao not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Válidos: {sorted(VALID_STATUSES)}")

    doc = Documento(**doc_in.model_dump(), enviado_por=current_user.id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document(db: Session, doc_id: int, current_user: Usuario) -> Documento:
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)
    return doc


def list_documents(
    db: Session,
    current_user: Usuario,
    skip: int,
    limit: int,
    tipo_documento: str | None,
    situacao: str | None,
    imovel_id: int | None,
    proposta_id: int | None,
) -> dict:
    query = db.query(Documento)

    if current_user.perfil != "admin":
        query = query.filter(Documento.enviado_por == current_user.id)

    if tipo_documento:
        query = query.filter(Documento.tipo_documento == tipo_documento)
    if situacao:
        query = query.filter(Documento.situacao == situacao)
    if imovel_id:
        query = query.filter(Documento.imovel_id == imovel_id)
    if proposta_id:
        query = query.filter(Documento.proposta_id == proposta_id)

    total = query.count()
    items = query.order_by(Documento.criado_em.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "page": (skip // limit) + 1, "limit": limit}


def update_document(
    db: Session, doc_id: int, doc_in: DocumentoAtualizar, current_user: Usuario
) -> Documento:
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)

    updates = doc_in.model_dump(exclude_unset=True)
    if "tipo_documento" in updates and updates["tipo_documento"] not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Válidos: {sorted(VALID_TYPES)}")
    if "situacao" in updates and updates["situacao"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Válidos: {sorted(VALID_STATUSES)}")

    for field, value in updates.items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, doc_id: int, current_user: Usuario) -> None:
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)
    db.delete(doc)
    db.commit()
