from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from app.db.database import get_db
from app.models.appointment import Appointment
from app.models.property import Property
from app.models.user import User
from .auth import get_current_user, oauth2_scheme
from app.core.config import settings

class PropertyBriefResponse(BaseModel):
    id: int
    title: str
    city: str | None
    neighborhood: str | None
    price: float
    image_url: str | None

    class Config:
        from_attributes = True

router = APIRouter(prefix="/appointments", tags=["appointments"])
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

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
    feedback_visita: str | None = None
    property: PropertyBriefResponse | None = None
    
    class Config:
        from_attributes = True

async def get_optional_current_user(db: Session = Depends(get_db), token: str | None = Depends(oauth2_scheme_optional)):
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
        
    # Buyer ID (somente se logado como 'user')
    buyer_id = None
    if current_user and current_user.role == 'user':
        buyer_id = current_user.id
        
    # Calcula data de término (1h depois por padrão)
    end_time = visit_in.visit_date + timedelta(hours=1)
        
    db_visit = Appointment(
        property_id=visit_in.property_id,
        broker_id=broker_id,
        buyer_id=buyer_id,
        visitor_name=visit_in.visitor_name,
        visitor_phone=visit_in.visitor_phone,
        visit_date=visit_in.visit_date,
        visit_end_time=end_time,
        notes=visit_in.notes
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

@router.get("/", response_model=List[AppointmentResponse])
def get_my_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Otimização N+1: Carrega o imóvel antecipadamente
    query = db.query(Appointment).options(joinedload(Appointment.property))
    
    # Se for comprador (user), vê as visitas que agendou
    if current_user.role == 'user':
        return query.filter(Appointment.buyer_id == current_user.id).order_by(Appointment.visit_date.asc()).all()
        
    # Agência vê todas as visitas para os imóveis cujo owner_id é o dela (dela ou do seu time)
    if current_user.role == 'agency':
        return query.join(Property).filter(Property.owner_id == current_user.id).order_by(Appointment.visit_date.asc()).all()
    else:
        # Corretor vê apenas as dele
        return query.filter(Appointment.broker_id == current_user.id).order_by(Appointment.visit_date.asc()).all()

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

@router.patch("/{appointment_id}/feedback")
def update_appointment_feedback(
    appointment_id: int, 
    feedback: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    # Validação de acesso (mesma do status)
    if appointment.broker_id != current_user.id and current_user.role != 'agency':
        raise HTTPException(status_code=403, detail="Acesso negado")

    appointment.feedback_visita = feedback
    db.commit()
    return {"message": "Feedback atualizado com sucesso", "feedback": feedback}
