from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.property import Property
from app.models.lead import Lead
from app.models.appointment import Appointment
from app.models.proposal import Proposal
from app.models.favorite import Favorite
from app.models.user import User


def _assert_owns_property(db: Session, property_id: int, user_id: int) -> Property:
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado ou sem acesso")
    return prop


def get_seller_properties(db: Session, user_id: int) -> list:
    """All properties where user is the manager/owner, with aggregated stats."""
    properties = db.query(Property).filter(Property.owner_id == user_id, Property.status == "active").all()
    result = []
    for p in properties:
        leads_count = db.query(Lead).filter(Lead.property_id == p.id).count()
        visits_count = db.query(Appointment).filter(Appointment.property_id == p.id).count()
        proposals_count = db.query(Proposal).filter(Proposal.property_id == p.id).count()
        pending_proposals = db.query(Proposal).filter(
            Proposal.property_id == p.id,
            Proposal.status == "pendente",
        ).count()
        result.append({
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "city": p.city,
            "neighborhood": p.neighborhood,
            "image_url": p.image_url,
            "listing_type": p.listing_type,
            "status": p.status,
            "created_at": p.created_at,
            "leads_count": leads_count,
            "visits_count": visits_count,
            "proposals_count": proposals_count,
            "pending_proposals": pending_proposals,
        })
    return result


def get_property_leads(db: Session, property_id: int, user_id: int) -> list:
    _assert_owns_property(db, property_id, user_id)
    leads = db.query(Lead).filter(Lead.property_id == property_id).order_by(Lead.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "name": l.name,
            "email": l.email,
            "phone": l.phone,
            "source": l.source,
            "status": l.status,
            "created_at": l.created_at,
        }
        for l in leads
    ]


def get_property_appointments(db: Session, property_id: int, user_id: int) -> list:
    _assert_owns_property(db, property_id, user_id)
    appts = (
        db.query(Appointment)
        .filter(Appointment.property_id == property_id)
        .order_by(Appointment.visit_date.asc())
        .all()
    )
    return [
        {
            "id": a.id,
            "visitor_name": a.visitor_name,
            "visitor_phone": a.visitor_phone,
            "visit_date": a.visit_date,
            "status": a.status,
            "notes": a.notes,
        }
        for a in appts
    ]


def get_property_proposals(db: Session, property_id: int, user_id: int) -> list:
    _assert_owns_property(db, property_id, user_id)
    proposals = (
        db.query(Proposal)
        .filter(Proposal.property_id == property_id)
        .order_by(Proposal.created_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "buyer_name": p.buyer_name,
            "buyer_email": p.buyer_email,
            "buyer_phone": p.buyer_phone,
            "proposed_price": p.proposed_price,
            "payment_method": p.payment_method,
            "financing_percentage": p.financing_percentage,
            "conditions": p.conditions,
            "message": p.message,
            "status": p.status,
            "created_at": p.created_at,
        }
        for p in proposals
    ]


def get_property_ranking(db: Session, property_id: int, user_id: int) -> list:
    """
    Ranking de possível negócio por imóvel.
    Pontuação: proposta aceita=100, proposta pendente=70, visita realizada=50,
    visita pendente=40, favorito (nivel_interesse*10)=10-50, lead=20.
    Spec: 'ranking de possível negócio' e 'fechamento de negócio'.
    """
    _assert_owns_property(db, property_id, user_id)

    scores: dict[str, dict] = {}  # keyed by nome+contato

    def upsert(name: str, contact: str, source: str, delta: int) -> None:
        key = f"{name}|{contact}"
        if key not in scores:
            scores[key] = {"nome": name, "contato": contact, "fontes": [], "score": 0}
        scores[key]["score"] += delta
        scores[key]["fontes"].append(source)

    # Propostas
    for p in db.query(Proposal).filter(Proposal.property_id == property_id).all():
        delta = 100 if p.status == "aceita" else 70 if p.status == "pendente" else 30
        upsert(p.buyer_name, p.buyer_email or p.buyer_phone or "", f"proposta:{p.status}", delta)

    # Visitas
    for a in db.query(Appointment).filter(Appointment.property_id == property_id).all():
        delta = 50 if a.status == "completed" else 40 if a.status == "confirmed" else 25
        upsert(a.visitor_name, a.visitor_phone, f"visita:{a.status}", delta)

    # Favoritos com nivel_interesse
    favs = (
        db.query(Favorite, User)
        .join(User, Favorite.user_id == User.id)
        .filter(Favorite.property_id == property_id)
        .all()
    )
    for fav, usr in favs:
        nivel = fav.nivel_interesse or 3
        upsert(usr.name or usr.email, usr.email or usr.phone or "", f"favorito:nivel{nivel}", nivel * 10)

    # Leads
    for lead in db.query(Lead).filter(Lead.property_id == property_id).all():
        upsert(lead.name, lead.email or lead.phone or "", f"lead:{lead.status}", 20)

    ranking = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    return ranking


SELLER_ALLOWED_STATUSES = {"aceita", "recusada", "contraproposta"}


def seller_decide_proposal(
    db: Session,
    proposal_id: int,
    new_status: str,
    user_id: int,
) -> dict:
    """Seller (property owner) accepts, rejects, or counter-proposes."""
    if new_status not in SELLER_ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido para o vendedor. Permitidos: {SELLER_ALLOWED_STATUSES}",
        )
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    # Verify the user owns the property this proposal is for
    prop = db.query(Property).filter(
        Property.id == proposal.property_id,
        Property.owner_id == user_id,
    ).first()
    if not prop:
        raise HTTPException(status_code=403, detail="Sem permissão para decidir sobre esta proposta")

    proposal.status = new_status
    db.commit()
    db.refresh(proposal)
    return {
        "id": proposal.id,
        "status": proposal.status,
        "buyer_name": proposal.buyer_name,
        "proposed_price": proposal.proposed_price,
        "property_id": proposal.property_id,
    }
