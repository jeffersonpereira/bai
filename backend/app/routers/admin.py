from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
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

    class Config:
        from_attributes = True

class UserAdminUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    creci: str | None = None
    is_active: bool | None = None

class AdminStats(BaseModel):
    total_users: int
    total_agencies: int
    total_brokers: int
    total_properties: int
    total_leads: int
    recent_registrations: int

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
        "recent_registrations": db.query(User).filter(User.created_at >= one_week_ago).count()
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
    
    # Adicionar contagem de corretores para agências
    for user in users:
        if user.role == "agency":
            user.broker_count = db.query(User).filter(User.parent_id == user.id).count()
        else:
            user.broker_count = 0
            
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
