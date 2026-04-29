from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.proposta import ProposalStatusUpdate
from app.services import vendedor_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/vendedor", tags=["vendedor"])


@router.get("/properties")
def list_my_properties(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista imóveis do vendedor com contagens de leads, visitas e propostas."""
    return vendedor_service.get_seller_properties(db, current_user.id)


@router.get("/properties/{property_id}/leads")
def get_leads(
    property_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return vendedor_service.get_property_leads(db, property_id, current_user.id)


@router.get("/properties/{property_id}/appointments")
def get_appointments(
    property_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return vendedor_service.get_property_appointments(db, property_id, current_user.id)


@router.get("/properties/{property_id}/proposals")
def get_proposals(
    property_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return vendedor_service.get_property_proposals(db, property_id, current_user.id)


@router.get("/properties/{property_id}/ranking")
def get_ranking(
    property_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ranking de possível negócio: pontua compradores por engajamento
    (propostas, visitas, favoritos, leads).
    Spec: 'ranking de possível negócio' e 'fechamento de negócio'.
    """
    return vendedor_service.get_property_ranking(db, property_id, current_user.id)


@router.patch("/proposals/{proposal_id}/decision")
def decide_proposal(
    proposal_id: int,
    decision: ProposalStatusUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return vendedor_service.seller_decide_proposal(db, proposal_id, decision.situacao, current_user.id)
