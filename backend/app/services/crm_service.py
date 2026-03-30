from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.owner import Owner
from app.models.lead import Lead
from app.models.mandate import Mandate
from app.models.user import User
from app.models.activity import LeadActivity
from app.models.property import Property
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
