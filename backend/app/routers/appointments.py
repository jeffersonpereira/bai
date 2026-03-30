from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import jwt
from app.db.database import get_db
from app.models.appointment import Appointment
from app.models.property import Property
from app.models.user import User
from .auth import get_current_user, oauth2_scheme
from app.core.config import settings

router = APIRouter(prefix="/appointments", tags=["appointments"])

class AppointmentCreate(BaseModel):
    property_id: int
    visitor_name: str
    visitor_phone: str
    visit_date: datetime
    notes: str | None = None

class AppointmentResponse(BaseModel):
    id: int
    property_id: int
    broker_id: int | None # Opcional na criação, o sistema atribui
    visitor_name: str
    visitor_phone: str
    visit_date: datetime
    visit_end_time: datetime | None = None
    status: str
    notes: str | None
    created_at: datetime
    buyer_id: int | None
    
    class Config:
        from_attributes = True

async def get_optional_current_user(db: Session = Depends(get_db), token: str | None = Depends(oauth2_scheme)):
    if not token:
        return None
    try:
        from app.core.config import settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None

@router.post("/", response_model=AppointmentResponse)
def schedule_visit(
    visit_in: AppointmentCreate, 
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    # Localiza o corretor vinculado ao imóvel
    prop = db.query(Property).filter(Property.id == visit_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    # Atribuição Inteligente (Se tiver assigned_brokers pega o primeiro, senão pega o owner)
    broker_id = prop.owner_id
    if prop.assigned_brokers:
        broker_id = prop.assigned_brokers[0].id
        
    db_visit = Appointment(
        property_id=visit_in.property_id,
        broker_id=broker_id,
        buyer_id=current_user.id if current_user.role == 'user' else None,
        visitor_name=visit_in.visitor_name,
        visitor_phone=visit_in.visitor_phone,
        visit_date=visit_in.visit_date,
        visit_end_time=visit_in.visit_end_time,
        notes=visit_in.notes
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

@router.get("/", response_model=List[AppointmentResponse])
def get_my_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Se for comprador (user), vê as visitas que agendou
    if current_user.role == 'user':
        return db.query(Appointment).filter(Appointment.buyer_id == current_user.id).order_by(Appointment.visit_date.asc()).all()
        
    # Agência vê todas as visitas para os imóveis cujo owner_id é o dela (dela ou do seu time)
    if current_user.role == 'agency':
        return db.query(Appointment).join(Property).filter(Property.owner_id == current_user.id).order_by(Appointment.visit_date.asc()).all()
    else:
        # Corretor vê apenas as dele
        return db.query(Appointment).filter(Appointment.broker_id == current_user.id).order_by(Appointment.visit_date.asc()).all()

@router.patch("/{appointment_id}/status")
def change_appointment_status(
    appointment_id: int, 
    status: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status inválido")

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    # Validação de acesso
    if appointment.broker_id != current_user.id and current_user.role != 'agency':
        raise HTTPException(status_code=403, detail="Acesso negado")

    appointment.status = status
    db.commit()
    return {"message": f"Status alterado para {status}"}
