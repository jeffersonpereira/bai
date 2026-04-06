from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.lead import Lead
from .auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

# --- SCHEMAS ---

class UserAdminResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    role: str
    creci: str | None = None
    is_active: bool
    created_at: datetime
    broker_count: int | None = 0 # Para agências
    plan_type: str | None = None
    plan_expires_at: datetime | None = None

    class Config:
        from_attributes = True

class UserAdminUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    creci: str | None = None
    is_active: bool | None = None
    plan_type: str | None = None
    plan_expires_at: datetime | None = None

class AdminStats(BaseModel):
    total_users: int
    total_agencies: int
    total_brokers: int
    total_properties: int
    total_leads: int
    recent_registrations: int
    premium_users: int

# --- MIDDLEWARE-LIKE DEPENDENCY ---

def check_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    return current_user

# --- ROUTES ---

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    from datetime import datetime, timedelta
    one_week_ago = datetime.now() - timedelta(days=7)
    
    return {
        "total_users": db.query(User).count(),
        "total_agencies": db.query(User).filter(User.role == "agency").count(),
        "total_brokers": db.query(User).filter(User.role == "broker").count(),
        "total_properties": db.query(Property).count(),
        "total_leads": db.query(Lead).count(),
        "recent_registrations": db.query(User).filter(User.created_at >= one_week_ago).count(),
        "premium_users": db.query(User).filter(User.plan_type.in_(["pro", "premium"])).count()
    }

@router.get("/users", response_model=List[UserAdminResponse])
def list_users(
    role: str | None = Query(None),
    q: str | None = Query(None, description="Busca por nome ou email"),
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if q:
        query = query.filter(
            (User.name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )
    
    users = query.all()

    # Contagem de corretores em query única (GROUP BY) ao invés de N queries
    agency_ids = [u.id for u in users if u.role == "agency"]
    broker_counts: dict[int, int] = {}
    if agency_ids:
        rows = (
            db.query(User.parent_id, func.count(User.id))
            .filter(User.parent_id.in_(agency_ids))
            .group_by(User.parent_id)
            .all()
        )
        broker_counts = {parent_id: count for parent_id, count in rows}

    for user in users:
        user.broker_count = broker_counts.get(user.id, 0)

    return users

@router.patch("/users/{user_id}", response_model=UserAdminResponse)
def update_user_status(
    user_id: int,
    user_in: UserAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    
    update_data = user_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

class PropertyAdminStatusUpdate(BaseModel):
    status: str

class PropertyAdminOwnerResponse(BaseModel):
    name: str | None = None
    role: str

class PropertyAdminResponse(BaseModel):
    id: int
    title: str
    price: float
    city: str | None = None
    listing_type: str | None = None
    status: str
    image_url: str | None = None
    owner: PropertyAdminOwnerResponse | None = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PropertyAdminListResponse(BaseModel):
    items: List[PropertyAdminResponse]
    total: int
    page: int
    limit: int

@router.get("/properties", response_model=PropertyAdminListResponse)
def list_all_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    title: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    query = db.query(Property)
    
    if title:
        query = query.filter(Property.title.ilike(f"%{title}%"))
    if status:
        query = query.filter(Property.status == status)
        
    total = query.count()
    items = query.order_by(Property.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    # We return standard property data
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.patch("/properties/{property_id}/status")
def update_property_global_status(
    property_id: int,
    status_update: PropertyAdminStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
        
    prop.status = status_update.status
    db.commit()
    db.refresh(prop)
    return {"message": f"Status atualizado para {prop.status}", "property": prop}
