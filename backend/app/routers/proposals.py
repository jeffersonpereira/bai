from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import jwt

from app.db.database import get_db
from app.models.user import User
from app.schemas.proposal import ProposalCreate, ProposalResponse, PaginatedProposals, ProposalStatusUpdate
from app.services import proposal_service
from app.core.config import settings
from .auth import get_current_user, get_current_full_access, oauth2_scheme

router = APIRouter(prefix="/proposals", tags=["proposals"])


async def get_optional_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User | None:
    """Dependência opcional: retorna o usuário se autenticado, None caso contrário."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None


@router.post("/", response_model=ProposalResponse)
def create_proposal(
    proposal_in: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Cria uma proposta. Aceita usuários anônimos e autenticados."""
    return proposal_service.create_proposal(db, proposal_in, current_user)


@router.get("/", response_model=PaginatedProposals)
def list_proposals_broker(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    property_id: Optional[int] = Query(None, description="Filtrar por imóvel"),
):
    """Lista propostas recebidas (visão do corretor/imobiliária)."""
    return proposal_service.get_proposals_for_broker(
        db, current_user, skip, limit, status, property_id
    )


@router.get("/mine", response_model=PaginatedProposals)
def list_my_proposals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """Lista propostas enviadas pelo comprador logado."""
    return proposal_service.get_proposals_for_buyer(db, current_user.id, skip, limit)


@router.patch("/{proposal_id}/status", response_model=ProposalResponse)
def update_status(
    proposal_id: int,
    status_in: ProposalStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualiza status de uma proposta (broker ou comprador dono)."""
    return proposal_service.update_proposal_status(db, proposal_id, status_in, current_user)
