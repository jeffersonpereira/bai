from sqlalchemy.orm import Session
from sqlalchemy import not_

from app.models.usuario import Usuario
from app.models.imovel import Imovel
from app.models.visualizacao_imovel import VisualizacaoImovel


def mark_as_viewed(db: Session, property_id: int, user: Usuario) -> dict:
    exists = db.query(VisualizacaoImovel).filter(
        VisualizacaoImovel.usuario_id == user.id,
        VisualizacaoImovel.imovel_id == property_id,
    ).first()
    if not exists:
        db.add(VisualizacaoImovel(usuario_id=user.id, imovel_id=property_id))
        db.commit()
    return {"viewed": True, "imovel_id": property_id}


def get_new_properties(db: Session, user: Usuario, limit: int = 20) -> list[Imovel]:
    viewed_subquery = db.query(VisualizacaoImovel.imovel_id).filter(
        VisualizacaoImovel.usuario_id == user.id
    ).subquery()

    return (
        db.query(Imovel)
        .filter(
            Imovel.situacao == "ativo",
            not_(Imovel.id.in_(viewed_subquery)),
        )
        .order_by(Imovel.criado_em.desc())
        .limit(limit)
        .all()
    )


def get_seen_properties(db: Session, user: Usuario) -> list[dict]:
    views = (
        db.query(VisualizacaoImovel)
        .filter(VisualizacaoImovel.usuario_id == user.id)
        .order_by(VisualizacaoImovel.visualizado_em.desc())
        .all()
    )
    return [{"imovel_id": v.imovel_id, "visualizado_em": v.visualizado_em} for v in views]
