from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.appointment import Appointment
from app.models.property import Property
from app.models.user import User
from app.schemas.appointment import AppointmentCreate


def schedule_visit(db: Session, visit_in: AppointmentCreate, current_user: User | None) -> Appointment:
    prop = db.query(Property).filter(Property.id == visit_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    # Atribuição inteligente: corretores atribuídos têm prioridade sobre o owner
    broker_id = prop.owner_id
    if prop.assigned_brokers:
        broker_id = prop.assigned_brokers[0].id

    db_visit = Appointment(
        property_id=visit_in.property_id,
        broker_id=broker_id,
        buyer_id=current_user.id if current_user and current_user.role == "user" else None,
        visitor_name=visit_in.visitor_name,
        visitor_phone=visit_in.visitor_phone,
        visit_date=visit_in.visit_date,
        visit_end_time=visit_in.visit_end_time,
        notes=visit_in.notes,
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit


def get_appointments(db: Session, current_user: User) -> list:
    if current_user.role == "user":
        return (
            db.query(Appointment)
            .filter(Appointment.buyer_id == current_user.id)
            .order_by(Appointment.visit_date.asc())
            .all()
        )
    if current_user.role == "agency":
        return (
            db.query(Appointment)
            .join(Property)
            .filter(Property.owner_id == current_user.id)
            .order_by(Appointment.visit_date.asc())
            .all()
        )
    return (
        db.query(Appointment)
        .filter(Appointment.broker_id == current_user.id)
        .order_by(Appointment.visit_date.asc())
        .all()
    )


def change_appointment_status(db: Session, appointment_id: int, status: str, current_user: User) -> dict:
    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status inválido")

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    if appointment.broker_id != current_user.id and current_user.role != "agency":
        raise HTTPException(status_code=403, detail="Acesso negado")

    appointment.status = status
    db.commit()
    return {"message": f"Status alterado para {status}"}
