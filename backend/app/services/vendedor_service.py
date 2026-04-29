from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.imovel import Imovel
from app.models.lead import Lead
from app.models.agendamento import Agendamento
from app.models.proposta import Proposta
from app.models.favorito import Favorito
from app.models.usuario import Usuario


def _assert_owns_property(db: Session, property_id: int, user_id: int) -> Imovel:
    prop = db.query(Imovel).filter(Imovel.id == property_id, Imovel.corretor_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado ou sem acesso")
    return prop


def get_seller_properties(db: Session, user_id: int) -> list:
    properties = db.query(Imovel).filter(Imovel.corretor_id == user_id).all()
    if not properties:
        return []

    prop_ids = [p.id for p in properties]

    leads_map = dict(
        db.query(Lead.imovel_id, func.count(Lead.id))
        .filter(Lead.imovel_id.in_(prop_ids))
        .group_by(Lead.imovel_id).all()
    )
    visits_map = dict(
        db.query(Agendamento.imovel_id, func.count(Agendamento.id))
        .filter(Agendamento.imovel_id.in_(prop_ids))
        .group_by(Agendamento.imovel_id).all()
    )
    proposals_map = dict(
        db.query(Proposta.imovel_id, func.count(Proposta.id))
        .filter(Proposta.imovel_id.in_(prop_ids))
        .group_by(Proposta.imovel_id).all()
    )
    pending_map = dict(
        db.query(Proposta.imovel_id, func.count(Proposta.id))
        .filter(Proposta.imovel_id.in_(prop_ids), Proposta.situacao == "pendente")
        .group_by(Proposta.imovel_id).all()
    )
    pending_visits_map = dict(
        db.query(Agendamento.imovel_id, func.count(Agendamento.id))
        .filter(Agendamento.imovel_id.in_(prop_ids), Agendamento.situacao == "pendente")
        .group_by(Agendamento.imovel_id).all()
    )

    return [
        {
            "id": p.id,
            "titulo": p.titulo,
            "preco": p.preco,
            "cidade": p.cidade,
            "bairro": p.bairro,
            "url_imagem": p.url_imagem,
            "tipo_oferta": p.tipo_oferta,
            "situacao": p.situacao,
            "criado_em": p.criado_em,
            "leads_count": leads_map.get(p.id, 0),
            "visits_count": visits_map.get(p.id, 0),
            "proposals_count": proposals_map.get(p.id, 0),
            "pending_proposals": pending_map.get(p.id, 0),
            "pending_visits": pending_visits_map.get(p.id, 0),
        }
        for p in properties
    ]


def get_property_leads(db: Session, property_id: int, user_id: int) -> list:
    _assert_owns_property(db, property_id, user_id)
    leads = db.query(Lead).filter(Lead.imovel_id == property_id).order_by(Lead.criado_em.desc()).all()
    return [
        {
            "id": l.id,
            "nome": l.nome,
            "email": l.email,
            "telefone": l.telefone,
            "origem": l.origem,
            "situacao": l.situacao,
            "criado_em": l.criado_em,
        }
        for l in leads
    ]


def get_property_appointments(db: Session, property_id: int, user_id: int) -> list:
    _assert_owns_property(db, property_id, user_id)
    appts = (
        db.query(Agendamento)
        .filter(Agendamento.imovel_id == property_id)
        .order_by(Agendamento.data_visita.asc())
        .all()
    )
    return [
        {
            "id": a.id,
            "nome_visitante": a.nome_visitante,
            "telefone_visitante": a.telefone_visitante,
            "data_visita": a.data_visita,
            "situacao": a.situacao,
            "observacoes": a.observacoes,
        }
        for a in appts
    ]


def get_property_proposals(db: Session, property_id: int, user_id: int) -> list:
    _assert_owns_property(db, property_id, user_id)
    proposals = (
        db.query(Proposta)
        .filter(Proposta.imovel_id == property_id)
        .order_by(Proposta.criado_em.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "nome_comprador": p.nome_comprador,
            "email_comprador": p.email_comprador,
            "telefone_comprador": p.telefone_comprador,
            "valor_ofertado": p.valor_ofertado,
            "forma_pagamento": p.forma_pagamento,
            "percentual_financiamento": p.percentual_financiamento,
            "condicoes": p.condicoes,
            "mensagem": p.mensagem,
            "situacao": p.situacao,
            "criado_em": p.criado_em,
        }
        for p in proposals
    ]


def get_property_ranking(db: Session, property_id: int, user_id: int) -> list:
    _assert_owns_property(db, property_id, user_id)

    scores: dict[str, dict] = {}

    def upsert(name: str, contact: str, source: str, delta: int) -> None:
        key = f"{name}|{contact}"
        if key not in scores:
            scores[key] = {"nome": name, "contato": contact, "fontes": [], "score": 0}
        scores[key]["score"] += delta
        scores[key]["fontes"].append(source)

    for p in db.query(Proposta).filter(Proposta.imovel_id == property_id).all():
        delta = 100 if p.situacao == "aceita" else 70 if p.situacao == "pendente" else 30
        upsert(p.nome_comprador, p.email_comprador or p.telefone_comprador or "", f"proposta:{p.situacao}", delta)

    for a in db.query(Agendamento).filter(Agendamento.imovel_id == property_id).all():
        delta = 50 if a.situacao == "realizado" else 40 if a.situacao == "confirmado" else 25
        upsert(a.nome_visitante, a.telefone_visitante, f"visita:{a.situacao}", delta)

    favs = (
        db.query(Favorito, Usuario)
        .join(Usuario, Favorito.usuario_id == Usuario.id)
        .filter(Favorito.imovel_id == property_id)
        .all()
    )
    for fav, usr in favs:
        nivel = fav.nivel_interesse or 3
        upsert(usr.nome or usr.email, usr.email or usr.telefone or "", f"favorito:nivel{nivel}", nivel * 10)

    for lead in db.query(Lead).filter(Lead.imovel_id == property_id).all():
        upsert(lead.nome, lead.email or lead.telefone or "", f"lead:{lead.situacao}", 20)

    return sorted(scores.values(), key=lambda x: x["score"], reverse=True)


SELLER_ALLOWED_STATUSES = {"aceita", "recusada", "contraproposta"}


def seller_decide_proposal(
    db: Session,
    proposal_id: int,
    new_status: str,
    user_id: int,
) -> dict:
    if new_status not in SELLER_ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido para o vendedor. Permitidos: {SELLER_ALLOWED_STATUSES}",
        )
    proposal = db.query(Proposta).filter(Proposta.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    prop = db.query(Imovel).filter(
        Imovel.id == proposal.imovel_id,
        Imovel.corretor_id == user_id,
    ).first()
    if not prop:
        raise HTTPException(status_code=403, detail="Sem permissão para decidir sobre esta proposta")

    proposal.situacao = new_status
    db.commit()
    db.refresh(proposal)
    return {
        "id": proposal.id,
        "situacao": proposal.situacao,
        "nome_comprador": proposal.nome_comprador,
        "valor_ofertado": proposal.valor_ofertado,
        "imovel_id": proposal.imovel_id,
    }
