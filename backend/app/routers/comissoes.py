from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.services import comissao_service
from .auth import get_current_user, get_current_agency

router = APIRouter(prefix="/comissoes", tags=["comissoes"])


class ComissaoCreate(BaseModel):
    property_id: int
    corretor_id: int
    percentual: float
    proposal_id: int | None = None
    observacoes: str | None = None


class ComissaoStatusUpdate(BaseModel):
    status: str  # pendente | pago | cancelado


@router.get("/resumo")
def get_resumo(
    current_user: User = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    """Resumo financeiro de comissões para o dashboard da agência."""
    return comissao_service.get_resumo(db, current_user)


@router.get("/")
def list_comissoes(
    status: str | None = Query(None),
    current_user: User = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    """Lista todas as comissões da agência/corretores."""
    return comissao_service.list_comissoes(db, current_user, status)


@router.post("/")
def create_comissao(
    data: ComissaoCreate,
    current_user: User = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    """Registra uma nova comissão gerada por venda/locação."""
    return comissao_service.create_comissao(
        db,
        property_id=data.property_id,
        corretor_id=data.corretor_id,
        percentual=data.percentual,
        proposal_id=data.proposal_id,
        observacoes=data.observacoes,
        current_user=current_user,
    )


@router.patch("/{comissao_id}/status")
def update_status(
    comissao_id: int,
    body: ComissaoStatusUpdate,
    current_user: User = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    """Atualiza o status de pagamento de uma comissão (pendente → pago / cancelado)."""
    return comissao_service.update_status(db, comissao_id, body.status, current_user)
