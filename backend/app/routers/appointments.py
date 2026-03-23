from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from ..db.database import get_db
from ..models.appointment import Appointment
from ..models.property import Property
from ..models.user import User
from .auth import get_current_user

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
    broker_id: int | None
    visitor_name: str
    visitor_phone: str
    visit_date: datetime
    status: str
    notes: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/", response_model=AppointmentResponse)
def schedule_visit(visit_in: AppointmentCreate, db: Session = Depends(get_db)):
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
        visitor_name=visit_in.visitor_name,
        visitor_phone=visit_in.visitor_phone,
        visit_date=visit_in.visit_date,
        notes=visit_in.notes
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

@router.get("/", response_model=List[AppointmentResponse])
def get_my_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Retorna todas as visitas onde o usuário é o corretor responsável ou agência principal
    if current_user.role == 'agency':
        # Agência vê todas as visitas para os imóveis cujo owner_id é o dela (dela ou do seu time)
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
