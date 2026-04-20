from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate

VALID_TYPES = {
    "contrato", "escritura", "procuração", "rgi",
    "laudo", "cnh", "comprovante_renda", "outros",
}
VALID_STATUSES = {"rascunho", "pendente_assinatura", "assinado", "arquivado"}


def _check_access(doc: Document, current_user: User):
    """Broker/agency/admin vê tudo; outros só veem seus próprios docs."""
    if current_user.role in ("admin", "agency", "broker"):
        return
    if doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar este documento")


def create_document(db: Session, doc_in: DocumentCreate, current_user: User) -> Document:
    if doc_in.doc_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Válidos: {sorted(VALID_TYPES)}")
    if doc_in.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Válidos: {sorted(VALID_STATUSES)}")

    doc = Document(**doc_in.model_dump(), uploaded_by=current_user.id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document(db: Session, doc_id: int, current_user: User) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)
    return doc


def list_documents(
    db: Session,
    current_user: User,
    skip: int,
    limit: int,
    doc_type: str | None,
    status: str | None,
    property_id: int | None,
    proposal_id: int | None,
) -> dict:
    query = db.query(Document)

    if current_user.role in ("admin",):
        pass
    elif current_user.role in ("agency", "broker"):
        # Sees docs they uploaded + docs on their managed properties/proposals
        query = query.filter(Document.uploaded_by == current_user.id)
    else:
        query = query.filter(Document.uploaded_by == current_user.id)

    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    if status:
        query = query.filter(Document.status == status)
    if property_id:
        query = query.filter(Document.property_id == property_id)
    if proposal_id:
        query = query.filter(Document.proposal_id == proposal_id)

    total = query.count()
    items = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "page": (skip // limit) + 1, "limit": limit}


def update_document(
    db: Session, doc_id: int, doc_in: DocumentUpdate, current_user: User
) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)

    updates = doc_in.model_dump(exclude_unset=True)
    if "doc_type" in updates and updates["doc_type"] not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Válidos: {sorted(VALID_TYPES)}")
    if "status" in updates and updates["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Válidos: {sorted(VALID_STATUSES)}")

    for field, value in updates.items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, doc_id: int, current_user: User) -> None:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)
    db.delete(doc)
    db.commit()
