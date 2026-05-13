from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.comissao import ComissaoCreate, ComissaoStatusUpdate
from app.services import comissao_service
from app.core.deps import get_current_agency, get_current_broker_or_above

router = APIRouter(prefix="/comissoes", tags=["comissoes"])


@router.get("/resumo")
def get_resumo(
    current_user: Usuario = Depends(get_current_broker_or_above),
    db: Session = Depends(get_db),
):
    return comissao_service.get_resumo(db, current_user)


@router.get("/")
def list_comissoes(
    situacao: str | None = Query(None),
    current_user: Usuario = Depends(get_current_broker_or_above),
    db: Session = Depends(get_db),
):
    return comissao_service.list_comissoes(db, current_user, situacao)


@router.post("/")
def create_comissao(
    data: ComissaoCreate,
    current_user: Usuario = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    return comissao_service.create_comissao(
        db,
        imovel_id=data.imovel_id,
        corretor_id=data.corretor_id,
        percentual=data.percentual,
        proposta_id=data.proposta_id,
        observacoes=data.observacoes,
        current_user=current_user,
    )


@router.patch("/{comissao_id}/status")
def update_status(
    comissao_id: int,
    body: ComissaoStatusUpdate,
    current_user: Usuario = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    return comissao_service.update_status(db, comissao_id, body.situacao, current_user)
