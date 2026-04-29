from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoCriar, DocumentoAtualizar, DocumentoResposta, PaginatedDocuments
from app.services import documento_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/documentos", tags=["documentos"])


@router.post("/", response_model=DocumentoResposta, status_code=201)
def create_document(
    doc_in: DocumentoCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return documento_service.create_document(db, doc_in, current_user)


@router.get("/", response_model=PaginatedDocuments)
def list_documents(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tipo_documento: Optional[str] = Query(None, description="Filtrar por tipo"),
    situacao: Optional[str] = Query(None, description="Filtrar por situação"),
    imovel_id: Optional[int] = Query(None),
    proposta_id: Optional[int] = Query(None),
):
    return documento_service.list_documents(
        db, current_user, skip, limit, tipo_documento, situacao, imovel_id, proposta_id
    )


@router.get("/{doc_id}", response_model=DocumentoResposta)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return documento_service.get_document(db, doc_id, current_user)


@router.patch("/{doc_id}", response_model=DocumentoResposta)
def update_document(
    doc_id: int,
    doc_in: DocumentoAtualizar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return documento_service.update_document(db, doc_id, doc_in, current_user)


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    documento_service.delete_document(db, doc_id, current_user)
