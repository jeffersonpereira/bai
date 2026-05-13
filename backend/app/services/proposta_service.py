from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.proposta import Proposta
from app.models.imovel import Imovel
from app.models.usuario import Usuario
from app.schemas.proposta import PropostaCriar, ProposalStatusUpdate

VALID_STATUSES = {"pendente", "visualizada", "encaminhada", "aceita", "recusada", "contraproposta"}


def create_proposal(db: Session, proposal_in: PropostaCriar, current_user: Usuario | None) -> Proposta:
    prop = db.query(Imovel).filter(Imovel.id == proposal_in.imovel_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    data = proposal_in.model_dump()
    data["comprador_id"] = current_user.id if current_user else None
    if current_user:
        data["nome_comprador"] = data["nome_comprador"] or current_user.nome or ""
        data["email_comprador"] = data["email_comprador"] or current_user.email
        data["telefone_comprador"] = data["telefone_comprador"] or current_user.telefone
    data["corretor_id"] = prop.corretor_id

    db_proposal = Proposta(**data)
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    return db_proposal


def get_proposals_for_broker(
    db: Session,
    current_user: Usuario,
    skip: int,
    limit: int,
    situacao: str | None,
    imovel_id: int | None,
) -> dict:
    query = db.query(Proposta)

    if current_user.perfil == "admin":
        pass
    elif current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores] + [current_user.id]
        query = query.filter(Proposta.corretor_id.in_(broker_ids))
    else:
        # corretor independente ou membro de equipe — vê só as suas
        query = query.filter(Proposta.corretor_id == current_user.id)

    if situacao:
        query = query.filter(Proposta.situacao == situacao)
    if imovel_id:
        query = query.filter(Proposta.imovel_id == imovel_id)

    total = query.count()
    items = query.order_by(Proposta.criado_em.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "page": (skip // limit) + 1, "limit": limit}


def get_proposals_for_buyer(db: Session, user_id: int, skip: int, limit: int) -> dict:
    from sqlalchemy import or_
    # propostas que fez como comprador + propostas recebidas no imóvel que anunciou
    query = db.query(Proposta).filter(
        or_(Proposta.comprador_id == user_id, Proposta.corretor_id == user_id)
    )
    total = query.count()
    items = query.order_by(Proposta.criado_em.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "page": (skip // limit) + 1, "limit": limit}


def update_proposal_status(
    db: Session,
    proposal_id: int,
    status_in: ProposalStatusUpdate,
    current_user: Usuario,
) -> Proposta:
    if status_in.situacao not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Válidos: {VALID_STATUSES}")

    proposal = db.query(Proposta).filter(Proposta.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    is_broker = current_user.perfil in ("admin", "imobiliaria", "corretor")
    is_proposer = proposal.comprador_id == current_user.id
    # comprador que registrou o anúncio do imóvel age como dono do lado vendedor
    is_announcer = proposal.corretor_id == current_user.id and current_user.perfil == "comprador"

    if not is_broker and not is_proposer and not is_announcer:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar esta proposta")
    if is_proposer and not is_broker and not is_announcer and status_in.situacao != "recusada":
        raise HTTPException(status_code=403, detail="Compradores só podem cancelar (recusar) a própria proposta")

    proposal.situacao = status_in.situacao
    db.commit()
    db.refresh(proposal)
    return proposal
