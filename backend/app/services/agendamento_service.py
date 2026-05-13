from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from datetime import timedelta

from app.models.agendamento import Agendamento
from app.models.imovel import Imovel
from app.models.usuario import Usuario
from app.schemas.agendamento import AgendamentoCriar
from app.services.crm_service import criar_lead_auto


def schedule_visit(db: Session, visit_in: AgendamentoCriar, current_user: Usuario | None) -> Agendamento:
    prop = db.query(Imovel).filter(Imovel.id == visit_in.imovel_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    corretor_id = prop.corretor_id
    if prop.corretores_atribuidos:
        corretor_id = prop.corretores_atribuidos[0].id

    end_time = visit_in.data_visita + timedelta(hours=1)

    db_visit = Agendamento(
        imovel_id=visit_in.imovel_id,
        corretor_id=corretor_id,
        comprador_id=current_user.id if current_user else None,
        nome_visitante=visit_in.nome_visitante,
        telefone_visitante=visit_in.telefone_visitante,
        data_visita=visit_in.data_visita,
        data_fim_visita=end_time,
        observacoes=visit_in.observacoes,
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)

    criar_lead_auto(
        db,
        imovel_id=visit_in.imovel_id,
        corretor_id=corretor_id,
        nome=visit_in.nome_visitante,
        telefone=visit_in.telefone_visitante,
        email=current_user.email if current_user else None,
        origem="agendamento",
        situacao="visita",
        observacoes=f"Visita agendada para {visit_in.data_visita.strftime('%d/%m/%Y às %H:%M')}",
    )

    return db_visit


def update_feedback(db: Session, appointment_id: int, feedback: str, current_user: Usuario) -> dict:
    appointment = db.query(Agendamento).filter(Agendamento.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if appointment.corretor_id != current_user.id and current_user.perfil != "imobiliaria":
        raise HTTPException(status_code=403, detail="Acesso negado")
    appointment.feedback_visita = feedback
    db.commit()
    return {"message": "Feedback atualizado com sucesso", "feedback": feedback}


def get_appointments(db: Session, current_user: Usuario) -> list:
    base = db.query(Agendamento).options(joinedload(Agendamento.imovel))
    if current_user.perfil == "comprador":
        # visitas que agendou como visitante + visitas ao imóvel que ele anunciou
        return (
            base
            .filter(
                (Agendamento.comprador_id == current_user.id) |
                (Agendamento.corretor_id == current_user.id)
            )
            .order_by(Agendamento.data_visita.asc())
            .all()
        )
    if current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        return (
            base
            .join(Imovel)
            .filter(Imovel.corretor_id.in_(broker_ids))
            .order_by(Agendamento.data_visita.asc())
            .all()
        )
    # corretor e admin
    return (
        base
        .filter(
            (Agendamento.corretor_id == current_user.id) |
            (Agendamento.comprador_id == current_user.id)
        )
        .order_by(Agendamento.data_visita.asc())
        .all()
    )


def change_appointment_status(db: Session, appointment_id: int, situacao: str, current_user: Usuario) -> dict:
    valid_statuses = ["pendente", "confirmado", "cancelado", "realizado"]
    if situacao not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status inválido")

    appointment = db.query(Agendamento).filter(Agendamento.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    is_announcer = appointment.corretor_id == current_user.id
    is_agency = current_user.perfil == "imobiliaria"
    is_buyer = appointment.comprador_id == current_user.id and situacao == "cancelado"
    if not is_announcer and not is_agency and not is_buyer:
        raise HTTPException(status_code=403, detail="Acesso negado")

    appointment.situacao = situacao
    db.commit()
    return {"message": f"Status alterado para {situacao}"}
