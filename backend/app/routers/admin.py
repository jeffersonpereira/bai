from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel, ConfigDict

from app.db.database import get_db
from app.models.usuario import Usuario
from app.models.imovel import Imovel
from app.models.lead import Lead
from app.core.deps import get_current_admin
from app.schemas.usuario import UserAdminResponse, UserAdminUpdate
from app.schemas.admin import AdminStats

router = APIRouter(prefix="/admin", tags=["admin"])


class PropertyAdminStatusUpdate(BaseModel):
    situacao: str


class PropertyAdminCorretorBrief(BaseModel):
    nome: str | None = None
    perfil: str

    model_config = ConfigDict(from_attributes=True)


class PropertyAdminResponse(BaseModel):
    id: int
    titulo: str
    preco: float
    cidade: str | None = None
    tipo_oferta: str | None = None
    situacao: str
    url_imagem: str | None = None
    corretor: PropertyAdminCorretorBrief | None = None
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class PropertyAdminListResponse(BaseModel):
    items: List[PropertyAdminResponse]
    total: int
    page: int
    limit: int


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    one_week_ago = datetime.now() - timedelta(days=7)
    return {
        "total_users": db.query(Usuario).count(),
        "total_agencies": db.query(Usuario).filter(Usuario.perfil == "imobiliaria").count(),
        "total_brokers": db.query(Usuario).filter(Usuario.perfil == "corretor").count(),
        "total_properties": db.query(Imovel).count(),
        "total_leads": db.query(Lead).count(),
        "recent_registrations": db.query(Usuario).filter(Usuario.criado_em >= one_week_ago).count(),
        "premium_users": db.query(Usuario).filter(Usuario.tipo_plano.in_(["pro", "premium"])).count(),
    }


class UserAdminListResponse(BaseModel):
    items: List[UserAdminResponse]
    total: int
    page: int
    limit: int


@router.get("/users", response_model=UserAdminListResponse)
def list_users(
    perfil: str | None = Query(None),
    tipo_plano: str | None = Query(None),
    q: str | None = Query(None, description="Busca por nome ou email"),
    ativo: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    query = db.query(Usuario)
    if perfil:
        query = query.filter(Usuario.perfil == perfil)
    if tipo_plano:
        query = query.filter(Usuario.tipo_plano == tipo_plano)
    if ativo is not None:
        query = query.filter(Usuario.ativo == ativo)
    if q:
        query = query.filter(
            (Usuario.nome.ilike(f"%{q}%")) | (Usuario.email.ilike(f"%{q}%"))
        )

    total = query.count()
    users = query.order_by(Usuario.criado_em.desc()).offset((page - 1) * limit).limit(limit).all()

    agency_ids = [u.id for u in users if u.perfil == "imobiliaria"]
    broker_counts: dict[int, int] = {}
    if agency_ids:
        rows = (
            db.query(Usuario.imobiliaria_id, func.count(Usuario.id))
            .filter(Usuario.imobiliaria_id.in_(agency_ids))
            .group_by(Usuario.imobiliaria_id)
            .all()
        )
        broker_counts = {parent_id: count for parent_id, count in rows}

    for user in users:
        user.broker_count = broker_counts.get(user.id, 0)

    return {"items": users, "total": total, "page": page, "limit": limit}


@router.get("/plans/stats")
def get_plan_stats(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    now = datetime.now()
    soon = now + timedelta(days=7)
    rows = (
        db.query(Usuario.tipo_plano, func.count(Usuario.id))
        .filter(Usuario.ativo == True)
        .group_by(Usuario.tipo_plano)
        .all()
    )
    by_plan = {plan or "gratuito": count for plan, count in rows}
    expiring_soon = (
        db.query(func.count(Usuario.id))
        .filter(
            Usuario.plano_expira_em != None,
            Usuario.plano_expira_em >= now,
            Usuario.plano_expira_em <= soon,
            Usuario.ativo == True,
        )
        .scalar()
    )
    return {
        "gratuito": by_plan.get("gratuito", 0),
        "pro": by_plan.get("pro", 0),
        "premium": by_plan.get("premium", 0),
        "expirando_em_7_dias": expiring_soon,
    }


@router.patch("/users/{user_id}", response_model=UserAdminResponse)
def update_user(
    user_id: int,
    user_in: UserAdminUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    for key, value in user_in.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/properties", response_model=PropertyAdminListResponse)
def list_all_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    titulo: str | None = Query(None),
    situacao: str | None = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    query = db.query(Imovel)
    if titulo:
        query = query.filter(Imovel.titulo.ilike(f"%{titulo}%"))
    if situacao:
        query = query.filter(Imovel.situacao == situacao)

    total = query.count()
    items = query.order_by(Imovel.criado_em.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.patch("/properties/{property_id}/status")
def update_property_status(
    property_id: int,
    status_update: PropertyAdminStatusUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    prop = db.query(Imovel).filter(Imovel.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")

    prop.situacao = status_update.situacao
    db.commit()
    db.refresh(prop)
    return {"message": f"Status atualizado para {prop.situacao}", "property": prop}
