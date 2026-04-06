from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.proposal import Proposal
from app.models.property import Property
from app.models.user import User
from app.schemas.proposal import ProposalCreate, ProposalStatusUpdate

VALID_STATUSES = {"pendente", "visualizada", "encaminhada", "aceita", "recusada", "contraproposta"}


def create_proposal(db: Session, proposal_in: ProposalCreate, current_user: User | None) -> Proposal:
    prop = db.query(Property).filter(Property.id == proposal_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    db_proposal = Proposal(
        **proposal_in.model_dump(),
        buyer_user_id=current_user.id if current_user else None,
        # preenche nome/email/telefone do usuário logado se não enviados
        buyer_name=(proposal_in.buyer_name or (current_user.name if current_user else "")),
        buyer_email=(proposal_in.buyer_email or (current_user.email if current_user else None)),
        buyer_phone=(proposal_in.buyer_phone or (current_user.phone if current_user else None)),
        broker_id=prop.owner_id,
    )
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    return db_proposal


def get_proposals_for_broker(
    db: Session,
    current_user: User,
    skip: int,
    limit: int,
    status: str | None,
    property_id: int | None,
) -> dict:
    """Todas as propostas recebidas nos imóveis gerenciados pelo broker/agência."""
    query = db.query(Proposal)

    if current_user.role == "admin":
        pass  # vê tudo
    elif current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers] + [current_user.id]
        query = query.filter(Proposal.broker_id.in_(broker_ids))
    else:
        query = query.filter(Proposal.broker_id == current_user.id)

    if status:
        query = query.filter(Proposal.status == status)
    if property_id:
        query = query.filter(Proposal.property_id == property_id)

    total = query.count()
    items = query.order_by(Proposal.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "page": (skip // limit) + 1, "limit": limit}


def get_proposals_for_buyer(db: Session, user_id: int, skip: int, limit: int) -> dict:
    """Propostas enviadas pelo comprador logado."""
    query = db.query(Proposal).filter(Proposal.buyer_user_id == user_id)
    total = query.count()
    items = query.order_by(Proposal.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "page": (skip // limit) + 1, "limit": limit}


def update_proposal_status(
    db: Session,
    proposal_id: int,
    status_in: ProposalStatusUpdate,
    current_user: User,
) -> Proposal:
    if status_in.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Válidos: {VALID_STATUSES}")

    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    # Broker pode alterar qualquer status; comprador só pode cancelar a própria
    is_broker = current_user.role in ("admin", "agency", "broker")
    is_owner = proposal.buyer_user_id == current_user.id

    if not is_broker and not is_owner:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar esta proposta")
    if is_owner and not is_broker and status_in.status != "recusada":
        raise HTTPException(status_code=403, detail="Compradores só podem cancelar (recusar) a própria proposta")

    proposal.status = status_in.status
    db.commit()
    db.refresh(proposal)
    return proposal
