from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List
from ..db.database import get_db
from ..models.owner import Owner
from ..models.lead import Lead
from ..models.mandate import Mandate
from ..models.user import User
from ..models.activity import LeadActivity
from ..routers.auth import get_current_user, get_current_full_access
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter(prefix="/crm", tags=["crm"])

# --- SCHEMAS ---

class OwnerBase(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    document: str | None = None
    address: str | None = None
    notes: str | None = None

class OwnerCreate(OwnerBase):
    pass

class OwnerResponse(OwnerBase):
    id: int
    created_at: datetime
    broker_name: str | None = None
    class Config:
        from_attributes = True

class PaginatedOwners(BaseModel):
    items: List[OwnerResponse]
    total: int
    page: int
    limit: int

class LeadBase(BaseModel):
    property_id: int
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = "site"
    status: str | None = "novo"
    notes: str | None = None

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    broker_name: str | None = None
    class Config:
        from_attributes = True

class PaginatedLeads(BaseModel):
    items: List[LeadResponse]
    total: int
    page: int
    limit: int

class MandateCreate(BaseModel):
    property_id: int
    owner_id: int
    type: str  # venda, locacao
    commission_percentage: float
    is_exclusive: bool = False
    expiry_date: datetime | None = None

class ActivityBase(BaseModel):
    activity_type: str
    description: str

class ActivityCreate(ActivityBase):
    pass

class ActivityResponse(ActivityBase):
    id: int
    user_id: int
    created_at: datetime
    user_name: str | None = None
    class Config:
        from_attributes = True

# --- ROUTES ---

@router.post("/owners", response_model=OwnerResponse)
def create_owner(
    owner_in: OwnerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    db_owner = Owner(**owner_in.model_dump(), broker_id=current_user.id)
    db.add(db_owner)
    db.commit()
    db.refresh(db_owner)
    return db_owner

@router.put("/owners/{owner_id}", response_model=OwnerResponse)
def update_owner(
    owner_id: int,
    owner_in: OwnerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    db_owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="Proprietário não encontrado")
    
    if db_owner.broker_id != current_user.id and current_user.role != 'agency':
        raise HTTPException(status_code=403, detail="Acesso negado")

    update_data = owner_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_owner, key, value)
    
    db.commit()
    db.refresh(db_owner)
    return db_owner

@router.get("/owners", response_model=PaginatedOwners)
def get_owners(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
    skip: int = 0,
    limit: int = 20,
    search: str | None = None
):
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
                Owner.document.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    owners = query.order_by(Owner.created_at.desc()).offset(skip).limit(limit).all()
    
    # Adicionar nome do broker para o frontend
    for o in owners:
        o.broker_name = o.broker.name if o.broker else "Desconhecido"
        
    return {
        "items": owners,
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit
    }

@router.get("/leads", response_model=PaginatedLeads)
def get_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
    skip: int = 0,
    limit: int = 20,
    search: str | None = None
):
    query = db.query(Lead)
    if current_user.role == "admin":
        pass # Admin vê tudo
    elif current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        # Agências veem leads de seus corretores OU leads sem corretor (site/marketplace)
        query = query.filter(or_(Lead.broker_id.in_(broker_ids), Lead.broker_id == None))
    else:
        # Corretores veem apenas seus próprios leads
        query = query.filter(Lead.broker_id == current_user.id)
    
    if search:
        query = query.filter(
            or_(
                Lead.name.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.phone.ilike(f"%{search}%")
            )
        )
        
    total = query.count()
    leads = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    
    # Adicionar nome do broker para o frontend
    for l in leads:
        l.broker_name = l.broker.name if l.broker else "Plataforma"
        
    return {
        "items": leads,
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit
    }

@router.post("/leads", response_model=LeadResponse)
def create_lead_manual(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    db_lead = Lead(**lead_in.model_dump(), broker_id=current_user.id)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.post("/leads/public", response_model=LeadResponse)
def create_lead_public(
    lead_in: LeadCreate,
    db: Session = Depends(get_db)
):
    # Encontrar o broker do imóvel
    from ..models.property import Property
    prop = db.query(Property).filter(Property.id == lead_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Se o imóvel for externo (sem owner_id), o lead fica sem broker_id (atendimento centralizado)
    broker_id = prop.owner_id
    
    db_lead = Lead(**lead_in.model_dump(), broker_id=broker_id)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.patch("/leads/{lead_id}/status")
def update_lead_status(
    lead_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.broker_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    lead.status = status
    db.commit()
    return {"message": "Status atualizado"}
@router.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado.")
    
    from ..models.property import Property
    
    return {
        "total_users": db.query(User).count(),
        "total_properties": db.query(Property).count(),
        "total_leads": db.query(Lead).count()
    }

@router.post("/leads/{lead_id}/activities", response_model=ActivityResponse)
def create_lead_activity(
    lead_id: int,
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    
    db_activity = LeadActivity(
        **activity_in.model_dump(),
        lead_id=lead_id,
        user_id=current_user.id
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    db_activity.user_name = current_user.name
    return db_activity

@router.get("/leads/{lead_id}/activities", response_model=List[ActivityResponse])
def get_lead_activities(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    activities = db.query(LeadActivity).filter(LeadActivity.lead_id == lead_id).order_by(LeadActivity.created_at.desc()).all()
    for act in activities:
        act.user_name = act.user.name if act.user else "Sistema"
    return activities
