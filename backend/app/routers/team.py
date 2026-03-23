from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db.database import get_db
from ..models.user import User
from .auth import get_current_user, UserResponse, get_current_agency
from pydantic import BaseModel, EmailStr
from ..core.security import get_password_hash

router = APIRouter(prefix="/team", tags=["team"])

class BrokerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    creci: str | None = None

@router.post("/brokers", response_model=UserResponse)
def add_broker(
    broker_in: BrokerCreate,
    current_user: User = Depends(get_current_agency),
    db: Session = Depends(get_db)
):
    # Verificar se email já existe
    exists = db.query(User).filter(User.email == broker_in.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    new_broker = User(
        email=broker_in.email,
        hashed_password=get_password_hash(broker_in.password),
        name=broker_in.name,
        role="broker",
        phone=broker_in.phone,
        creci=broker_in.creci,
        parent_id=current_user.id
    )
    db.add(new_broker)
    db.commit()
    db.refresh(new_broker)
    return new_broker

@router.get("/brokers", response_model=List[UserResponse])
def list_brokers(
    current_user: User = Depends(get_current_agency),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(User.parent_id == current_user.id).all()
