from sqlalchemy.orm import Session
from sqlalchemy import or_, func, distinct
from fastapi import HTTPException

from app.models.owner import Owner
from app.models.lead import Lead
from app.models.mandate import Mandate
from app.models.user import User
from app.models.activity import LeadActivity
from app.models.property import Property
from app.models.appointment import Appointment
from app.models.proposal import Proposal
from app.models.favorite import Favorite
from app.schemas.owner import OwnerCreate
from app.schemas.lead import LeadCreate, ActivityCreate


# --- OWNERS ---

def create_owner(db: Session, owner_in: OwnerCreate, broker_id: int) -> Owner:
    db_owner = Owner(**owner_in.model_dump(), broker_id=broker_id)
    db.add(db_owner)
    db.commit()
    db.refresh(db_owner)
    return db_owner


def update_owner(db: Session, owner_id: int, owner_in: OwnerCreate, current_user: User) -> Owner:
    db_owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="Proprietário não encontrado")
    if db_owner.broker_id != current_user.id and current_user.role != "agency":
        raise HTTPException(status_code=403, detail="Acesso negado")

    for key, value in owner_in.model_dump(exclude_unset=True).items():
        setattr(db_owner, key, value)
    db.commit()
    db.refresh(db_owner)
    return db_owner


def get_owners(db: Session, current_user: User, skip: int, limit: int, search: str | None) -> dict:
    query = db.query(Owner)
    if current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        query = query.filter(Owner.broker_id.in_(broker_ids))
    else:
        query = query.filter(Owner.broker_id == current_user.id)

    if search:
        query = query.filter(
            or_(
                Owner.name.ilike(f"%{search}%"),
                Owner.email.ilike(f"%{search}%"),
                Owner.document.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    owners = query.order_by(Owner.created_at.desc()).offset(skip).limit(limit).all()

    # Enriquecer com nome do broker sem mutar o ORM object
    items = []
    for o in owners:
        item = o.__dict__.copy()
        item["broker_name"] = o.broker.name if o.broker else "Desconhecido"
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
    }


def get_owner_portfolio(db: Session, owner_id: int, current_user: User) -> dict:
    """Retorna o portfólio completo de um proprietário com stats agregados em queries únicas."""
    owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Proprietário não encontrado")

    broker_ids = [current_user.id]
    if current_user.role == "agency":
        broker_ids += [b.id for b in current_user.brokers]
    if owner.broker_id not in broker_ids:
        raise HTTPException(status_code=403, detail="Acesso negado")

    properties = db.query(Property).filter(Property.actual_owner_id == owner_id).all()
    if not properties:
        broker = db.query(User).filter(User.id == owner.broker_id).first()
        return {
            "owner": {"id": owner.id, "name": owner.name, "email": owner.email,
                      "phone": owner.phone, "notes": owner.notes},
            "broker": {"name": broker.name if broker else None, "phone": broker.phone if broker else None,
                       "email": broker.email if broker else None, "creci": broker.creci if broker else None},
            "totals": {"properties": 0, "visits": 0, "proposals": 0, "leads": 0, "pending_proposals": 0},
            "properties": [],
        }

    prop_ids = [p.id for p in properties]

    # ── Aggregações em queries únicas ──────────────────────────────────────────
    visit_counts = dict(
        db.query(Appointment.property_id, func.count(Appointment.id))
        .filter(Appointment.property_id.in_(prop_ids))
        .group_by(Appointment.property_id).all()
    )
    proposal_counts = dict(
        db.query(Proposal.property_id, func.count(Proposal.id))
        .filter(Proposal.property_id.in_(prop_ids))
        .group_by(Proposal.property_id).all()
    )
    pending_counts = dict(
        db.query(Proposal.property_id, func.count(Proposal.id))
        .filter(Proposal.property_id.in_(prop_ids), Proposal.status == "pendente")
        .group_by(Proposal.property_id).all()
    )
    lead_counts = dict(
        db.query(Lead.property_id, func.count(Lead.id))
        .filter(Lead.property_id.in_(prop_ids))
        .group_by(Lead.property_id).all()
    )
    fav_counts = dict(
        db.query(Favorite.property_id, func.count(distinct(Favorite.id)))
        .filter(Favorite.property_id.in_(prop_ids))
        .group_by(Favorite.property_id).all()
    )

    # Próximas visitas (uma por imóvel, status pending/confirmed, mais cedo primeiro)
    upcoming_visits = (
        db.query(Appointment)
        .filter(Appointment.property_id.in_(prop_ids), Appointment.status.in_(("pending", "confirmed")))
        .order_by(Appointment.visit_date.asc())
        .all()
    )
    next_visit_by_prop: dict = {}
    for v in upcoming_visits:
        if v.property_id not in next_visit_by_prop:
            next_visit_by_prop[v.property_id] = v

    # Todas as visitas e propostas para exibição detalhada
    all_visits = (
        db.query(Appointment)
        .filter(Appointment.property_id.in_(prop_ids))
        .order_by(Appointment.visit_date.desc())
        .all()
    )
    all_proposals = (
        db.query(Proposal)
        .filter(Proposal.property_id.in_(prop_ids))
        .order_by(Proposal.created_at.desc())
        .all()
    )

    visits_by_prop: dict[int, list] = {pid: [] for pid in prop_ids}
    for v in all_visits:
        visits_by_prop[v.property_id].append(v)

    proposals_by_prop: dict[int, list] = {pid: [] for pid in prop_ids}
    for pr in all_proposals:
        proposals_by_prop[pr.property_id].append(pr)

    # ── Montagem do portfólio ──────────────────────────────────────────────────
    totals = {"properties": len(properties), "visits": 0, "proposals": 0,
              "leads": 0, "pending_proposals": 0}
    portfolio = []

    for p in properties:
        vc = visit_counts.get(p.id, 0)
        pc = proposal_counts.get(p.id, 0)
        pend = pending_counts.get(p.id, 0)
        lc = lead_counts.get(p.id, 0)
        fc = fav_counts.get(p.id, 0)
        nv = next_visit_by_prop.get(p.id)

        totals["visits"] += vc
        totals["proposals"] += pc
        totals["leads"] += lc
        totals["pending_proposals"] += pend

        portfolio.append({
            "id": p.id, "title": p.title, "price": p.price,
            "valor_aluguel": p.valor_aluguel, "city": p.city,
            "neighborhood": p.neighborhood, "image_url": p.image_url,
            "listing_type": p.listing_type, "status": p.status,
            "commission_percentage": p.commission_percentage,
            "created_at": p.created_at,
            "leads_count": lc, "visits_count": vc,
            "proposals_count": pc, "pending_proposals": pend, "favorites_count": fc,
            "next_visit": {
                "date": nv.visit_date, "visitor": nv.visitor_name, "status": nv.status,
            } if nv else None,
            "visits": [
                {"id": v.id, "visitor_name": v.visitor_name, "visitor_phone": v.visitor_phone,
                 "visit_date": v.visit_date, "status": v.status,
                 "notes": v.notes, "feedback_visita": v.feedback_visita}
                for v in visits_by_prop[p.id]
            ],
            "proposals": [
                {"id": pr.id, "buyer_name": pr.buyer_name, "buyer_phone": pr.buyer_phone,
                 "proposed_price": pr.proposed_price, "payment_method": pr.payment_method,
                 "status": pr.status, "created_at": pr.created_at, "message": pr.message}
                for pr in proposals_by_prop[p.id]
            ],
        })

    broker = db.query(User).filter(User.id == owner.broker_id).first()
    return {
        "owner": {"id": owner.id, "name": owner.name, "email": owner.email,
                  "phone": owner.phone, "notes": owner.notes},
        "broker": {"name": broker.name if broker else None, "phone": broker.phone if broker else None,
                   "email": broker.email if broker else None, "creci": broker.creci if broker else None},
        "totals": totals,
        "properties": portfolio,
    }


# --- LEADS ---

def get_leads(db: Session, current_user: User, skip: int, limit: int, search: str | None) -> dict:
    query = db.query(Lead)
    if current_user.role == "admin":
        pass
    elif current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        query = query.filter(or_(Lead.broker_id.in_(broker_ids), Lead.broker_id.is_(None)))
    else:
        query = query.filter(Lead.broker_id == current_user.id)

    if search:
        query = query.filter(
            or_(
                Lead.name.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.phone.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    leads = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for l in leads:
        item = l.__dict__.copy()
        item["broker_name"] = l.broker.name if l.broker else "Plataforma"
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
    }


def create_lead(db: Session, lead_in: LeadCreate, broker_id: int) -> Lead:
    db_lead = Lead(**lead_in.model_dump(), broker_id=broker_id)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


def create_public_lead(db: Session, lead_in: LeadCreate) -> Lead:
    prop = db.query(Property).filter(Property.id == lead_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    db_lead = Lead(**lead_in.model_dump(), broker_id=prop.owner_id)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


def update_lead_status(db: Session, lead_id: int, status: str, current_user: User) -> dict:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    # Admin pode alterar qualquer lead; broker só altera os seus
    if current_user.role != "admin" and lead.broker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    lead.status = status
    db.commit()
    return {"message": "Status atualizado"}


# --- MANDATES ---

def create_mandate(db: Session, mandate_in, broker_id: int) -> Mandate:
    db_mandate = Mandate(**mandate_in.model_dump(), broker_id=broker_id)
    db.add(db_mandate)
    db.commit()
    db.refresh(db_mandate)
    return db_mandate


# --- ACTIVITIES ---

def add_activity(db: Session, lead_id: int, activity_in: ActivityCreate, current_user: User) -> dict:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    db_activity = LeadActivity(
        **activity_in.model_dump(),
        lead_id=lead_id,
        user_id=current_user.id,
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    return {
        **db_activity.__dict__,
        "user_name": current_user.name,
    }


def get_activities(db: Session, lead_id: int) -> list:
    activities = (
        db.query(LeadActivity)
        .filter(LeadActivity.lead_id == lead_id)
        .order_by(LeadActivity.created_at.desc())
        .all()
    )
    return [
        {**act.__dict__, "user_name": act.user.name if act.user else "Sistema"}
        for act in activities
    ]
