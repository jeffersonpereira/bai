from sqlalchemy.orm import Session
from sqlalchemy import or_, func, distinct
from fastapi import HTTPException

from app.models.proprietario import Proprietario
from app.models.lead import Lead
from app.models.mandato import Mandato
from app.models.usuario import Usuario
from app.models.atividade import AtividadeLead
from app.models.imovel import Imovel
from app.models.agendamento import Agendamento
from app.models.proposta import Proposta
from app.models.favorito import Favorito
from app.schemas.proprietario import ProprietarioCriar
from app.schemas.lead import LeadCriar, ActivityCreate


# --- OWNERS ---

def create_owner(db: Session, owner_in: ProprietarioCriar, corretor_id: int) -> Proprietario:
    db_owner = Proprietario(**owner_in.model_dump(), corretor_id=corretor_id)
    db.add(db_owner)
    db.commit()
    db.refresh(db_owner)
    return db_owner


def update_owner(db: Session, owner_id: int, owner_in: ProprietarioCriar, current_user: Usuario) -> Proprietario:
    db_owner = db.query(Proprietario).filter(Proprietario.id == owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="Proprietário não encontrado")
    if db_owner.corretor_id != current_user.id and current_user.perfil != "imobiliaria":
        raise HTTPException(status_code=403, detail="Acesso negado")

    for key, value in owner_in.model_dump(exclude_unset=True).items():
        setattr(db_owner, key, value)
    db.commit()
    db.refresh(db_owner)
    return db_owner


def get_owners(db: Session, current_user: Usuario, skip: int, limit: int, search: str | None) -> dict:
    query = db.query(Proprietario)
    if current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        query = query.filter(Proprietario.corretor_id.in_(broker_ids))
    else:
        query = query.filter(Proprietario.corretor_id == current_user.id)

    if search:
        query = query.filter(
            or_(
                Proprietario.nome.ilike(f"%{search}%"),
                Proprietario.email.ilike(f"%{search}%"),
                Proprietario.documento.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    owners = query.order_by(Proprietario.criado_em.desc()).offset(skip).limit(limit).all()

    items = []
    for o in owners:
        item = o.__dict__.copy()
        item["broker_name"] = o.corretor.nome if o.corretor else "Desconhecido"
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
    }


def get_owner_portfolio(db: Session, owner_id: int, current_user: Usuario) -> dict:
    owner = db.query(Proprietario).filter(Proprietario.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Proprietário não encontrado")

    broker_ids = [current_user.id]
    if current_user.perfil == "imobiliaria":
        broker_ids += [b.id for b in current_user.corretores]
    if owner.corretor_id not in broker_ids:
        raise HTTPException(status_code=403, detail="Acesso negado")

    properties = db.query(Imovel).filter(Imovel.proprietario_id == owner_id).all()
    if not properties:
        broker = db.query(Usuario).filter(Usuario.id == owner.corretor_id).first()
        return {
            "owner": {"id": owner.id, "nome": owner.nome, "email": owner.email,
                      "telefone": owner.telefone, "observacoes": owner.observacoes},
            "broker": {"nome": broker.nome if broker else None, "telefone": broker.telefone if broker else None,
                       "email": broker.email if broker else None, "creci": broker.creci if broker else None},
            "totals": {"properties": 0, "visits": 0, "proposals": 0, "leads": 0, "pending_proposals": 0},
            "properties": [],
        }

    prop_ids = [p.id for p in properties]

    visit_counts = dict(
        db.query(Agendamento.imovel_id, func.count(Agendamento.id))
        .filter(Agendamento.imovel_id.in_(prop_ids))
        .group_by(Agendamento.imovel_id).all()
    )
    proposal_counts = dict(
        db.query(Proposta.imovel_id, func.count(Proposta.id))
        .filter(Proposta.imovel_id.in_(prop_ids))
        .group_by(Proposta.imovel_id).all()
    )
    pending_counts = dict(
        db.query(Proposta.imovel_id, func.count(Proposta.id))
        .filter(Proposta.imovel_id.in_(prop_ids), Proposta.situacao == "pendente")
        .group_by(Proposta.imovel_id).all()
    )
    lead_counts = dict(
        db.query(Lead.imovel_id, func.count(Lead.id))
        .filter(Lead.imovel_id.in_(prop_ids))
        .group_by(Lead.imovel_id).all()
    )
    fav_counts = dict(
        db.query(Favorito.imovel_id, func.count(distinct(Favorito.id)))
        .filter(Favorito.imovel_id.in_(prop_ids))
        .group_by(Favorito.imovel_id).all()
    )

    upcoming_visits = (
        db.query(Agendamento)
        .filter(Agendamento.imovel_id.in_(prop_ids), Agendamento.situacao.in_(("pendente", "confirmado")))
        .order_by(Agendamento.data_visita.asc())
        .all()
    )
    next_visit_by_prop: dict = {}
    for v in upcoming_visits:
        if v.imovel_id not in next_visit_by_prop:
            next_visit_by_prop[v.imovel_id] = v

    all_visits = (
        db.query(Agendamento)
        .filter(Agendamento.imovel_id.in_(prop_ids))
        .order_by(Agendamento.data_visita.desc())
        .all()
    )
    all_proposals = (
        db.query(Proposta)
        .filter(Proposta.imovel_id.in_(prop_ids))
        .order_by(Proposta.criado_em.desc())
        .all()
    )

    visits_by_prop: dict[int, list] = {pid: [] for pid in prop_ids}
    for v in all_visits:
        visits_by_prop[v.imovel_id].append(v)

    proposals_by_prop: dict[int, list] = {pid: [] for pid in prop_ids}
    for pr in all_proposals:
        proposals_by_prop[pr.imovel_id].append(pr)

    totals = {"properties": len(properties), "visits": 0, "proposals": 0,
              "leads": 0, "pending_proposals": 0}
    portfolio = []

    for p in properties:
        vc = visit_counts.get(p.id, 0)
        pc = proposal_counts.get(p.id, 0)
        pend = pending_counts.get(p.id, 0)
        lc = lead_counts.get(p.id, 0)
        fc = fav_counts.get(p.id, 0)
        nv = next_visit_by_prop.get(p.id)

        totals["visits"] += vc
        totals["proposals"] += pc
        totals["leads"] += lc
        totals["pending_proposals"] += pend

        portfolio.append({
            "id": p.id, "titulo": p.titulo, "preco": p.preco,
            "valor_aluguel": p.valor_aluguel, "cidade": p.cidade,
            "bairro": p.bairro, "url_imagem": p.url_imagem,
            "tipo_oferta": p.tipo_oferta, "situacao": p.situacao,
            "percentual_comissao": p.percentual_comissao,
            "criado_em": p.criado_em,
            "leads_count": lc, "visits_count": vc,
            "proposals_count": pc, "pending_proposals": pend, "favorites_count": fc,
            "next_visit": {
                "date": nv.data_visita, "visitor": nv.nome_visitante, "status": nv.situacao,
            } if nv else None,
            "visits": [
                {"id": v.id, "nome_visitante": v.nome_visitante, "telefone_visitante": v.telefone_visitante,
                 "data_visita": v.data_visita, "situacao": v.situacao,
                 "observacoes": v.observacoes, "feedback_visita": v.feedback_visita}
                for v in visits_by_prop[p.id]
            ],
            "proposals": [
                {"id": pr.id, "nome_comprador": pr.nome_comprador, "telefone_comprador": pr.telefone_comprador,
                 "valor_ofertado": pr.valor_ofertado, "forma_pagamento": pr.forma_pagamento,
                 "situacao": pr.situacao, "criado_em": pr.criado_em, "mensagem": pr.mensagem}
                for pr in proposals_by_prop[p.id]
            ],
        })

    broker = db.query(Usuario).filter(Usuario.id == owner.corretor_id).first()
    return {
        "owner": {"id": owner.id, "nome": owner.nome, "email": owner.email,
                  "telefone": owner.telefone, "observacoes": owner.observacoes},
        "broker": {"nome": broker.nome if broker else None, "telefone": broker.telefone if broker else None,
                   "email": broker.email if broker else None, "creci": broker.creci if broker else None},
        "totals": totals,
        "properties": portfolio,
    }


# --- LEADS ---

def get_leads(db: Session, current_user: Usuario, skip: int, limit: int, search: str | None, situacao: str | None = None) -> dict:
    query = db.query(Lead)
    if current_user.perfil == "admin":
        pass
    elif current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        query = query.filter(or_(Lead.corretor_id.in_(broker_ids), Lead.corretor_id.is_(None)))
    else:
        query = query.filter(Lead.corretor_id == current_user.id)

    if search:
        query = query.filter(
            or_(
                Lead.nome.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.telefone.ilike(f"%{search}%"),
            )
        )

    if situacao:
        query = query.filter(Lead.situacao == situacao)

    total = query.count()
    leads = query.order_by(Lead.criado_em.desc()).offset(skip).limit(limit).all()

    items = []
    for l in leads:
        item = l.__dict__.copy()
        item["broker_name"] = l.corretor.nome if l.corretor else "Plataforma"
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
    }


def create_lead(db: Session, lead_in: LeadCriar, corretor_id: int) -> Lead:
    db_lead = Lead(**lead_in.model_dump(), corretor_id=corretor_id)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


def create_public_lead(db: Session, lead_in: LeadCriar) -> Lead:
    prop = db.query(Imovel).filter(Imovel.id == lead_in.imovel_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    db_lead = Lead(**lead_in.model_dump(), corretor_id=prop.corretor_id)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


SITUACOES_KANBAN = ["novo", "contatado", "visita", "proposta", "fechado", "perdido"]


def get_leads_kanban(db: Session, current_user: Usuario) -> dict:
    query = db.query(Lead)
    if current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        query = query.filter(Lead.corretor_id.in_(broker_ids))
    else:
        query = query.filter(Lead.corretor_id == current_user.id)

    leads = query.order_by(Lead.criado_em.desc()).limit(300).all()

    colunas: dict = {s: [] for s in SITUACOES_KANBAN}
    for lead in leads:
        col = lead.situacao if lead.situacao in colunas else "novo"
        colunas[col].append({
            "id": lead.id,
            "nome": lead.nome,
            "telefone": lead.telefone,
            "email": lead.email,
            "origem": lead.origem,
            "situacao": lead.situacao,
            "imovel_id": lead.imovel_id,
            "broker_name": lead.corretor.nome if lead.corretor else "Plataforma",
            "criado_em": lead.criado_em.isoformat() if lead.criado_em else None,
        })

    return colunas


def update_lead_status(db: Session, lead_id: int, situacao: str, current_user: Usuario) -> dict:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    if current_user.perfil != "admin" and lead.corretor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    lead.situacao = situacao
    db.commit()
    return {"message": "Status atualizado"}


# --- MANDATES ---

def create_mandate(db: Session, mandate_in, corretor_id: int) -> Mandato:
    db_mandate = Mandato(**mandate_in.model_dump(), corretor_id=corretor_id)
    db.add(db_mandate)
    db.commit()
    db.refresh(db_mandate)
    return db_mandate


# --- ACTIVITIES ---

def add_activity(db: Session, lead_id: int, activity_in: ActivityCreate, current_user: Usuario) -> dict:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    db_activity = AtividadeLead(
        **activity_in.model_dump(),
        lead_id=lead_id,
        usuario_id=current_user.id,
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    return {
        **db_activity.__dict__,
        "user_name": current_user.nome,
    }


def get_activities(db: Session, lead_id: int) -> list:
    activities = (
        db.query(AtividadeLead)
        .filter(AtividadeLead.lead_id == lead_id)
        .order_by(AtividadeLead.criado_em.desc())
        .all()
    )
    return [
        {**act.__dict__, "user_name": act.usuario.nome if act.usuario else "Sistema"}
        for act in activities
    ]
