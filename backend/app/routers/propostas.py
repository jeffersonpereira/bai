from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.proposta import PropostaCriar, PropostaResposta, PaginatedProposals, ProposalStatusUpdate
from app.services import proposta_service
from app.core.deps import get_current_user, get_current_full_access, get_optional_user

router = APIRouter(prefix="/propostas", tags=["propostas"])


@router.post("/", response_model=PropostaResposta)
def create_proposal(
    proposal_in: PropostaCriar,
    db: Session = Depends(get_db),
    current_user: Usuario | None = Depends(get_optional_user),
):
    return proposta_service.create_proposal(db, proposal_in, current_user)


@router.get("/", response_model=PaginatedProposals)
def list_proposals_broker(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_full_access),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    situacao: Optional[str] = Query(None),
    imovel_id: Optional[int] = Query(None),
):
    return proposta_service.get_proposals_for_broker(
        db, current_user, skip, limit, situacao, imovel_id
    )


@router.get("/mine", response_model=PaginatedProposals)
def list_my_proposals(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return proposta_service.get_proposals_for_buyer(db, current_user.id, skip, limit)


@router.patch("/{proposal_id}/status", response_model=PropostaResposta)
def update_status(
    proposal_id: int,
    status_in: ProposalStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return proposta_service.update_proposal_status(db, proposal_id, status_in, current_user)
