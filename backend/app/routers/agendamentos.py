from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.db.database import get_db
from app.models.usuario import Usuario
from app.models.agendamento import Agendamento
from app.schemas.agendamento import AgendamentoCriar, AgendamentoResposta
from app.services import agendamento_service
from app.core.deps import get_current_user, get_optional_user

router = APIRouter(prefix="/agendamentos", tags=["agendamentos"])


@router.post("/", response_model=AgendamentoResposta)
def schedule_visit(
    visit_in: AgendamentoCriar,
    db: Session = Depends(get_db),
    current_user: Usuario | None = Depends(get_optional_user),
):
    return agendamento_service.schedule_visit(db, visit_in, current_user)


@router.get("/", response_model=List[AgendamentoResposta])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return agendamento_service.get_appointments(db, current_user)


@router.patch("/{appointment_id}/status")
def change_appointment_status(
    appointment_id: int,
    situacao: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return agendamento_service.change_appointment_status(db, appointment_id, situacao, current_user)


@router.patch("/{appointment_id}/feedback")
def update_appointment_feedback(
    appointment_id: int,
    feedback: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return agendamento_service.update_feedback(db, appointment_id, feedback, current_user)
