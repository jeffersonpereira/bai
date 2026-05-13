from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.usuario import Usuario
from app.models.imovel import Imovel
from app.models.lead import Lead
from app.schemas.usuario import UserAdminUpdate
from app.schemas.admin import AdminStats, AdminCriarUsuarioRequest
from app.core.security import get_password_hash


def get_stats(db: Session) -> AdminStats:
    one_week_ago = datetime.now() - timedelta(days=7)
    return AdminStats(
        total_users=db.query(Usuario).count(),
        total_agencies=db.query(Usuario).filter(Usuario.perfil == "imobiliaria").count(),
        total_brokers=db.query(Usuario).filter(Usuario.perfil == "corretor").count(),
        total_properties=db.query(Imovel).count(),
        total_leads=db.query(Lead).count(),
        recent_registrations=db.query(Usuario).filter(Usuario.criado_em >= one_week_ago).count(),
        premium_users=db.query(Usuario).filter(Usuario.tipo_plano.in_(["pro", "premium"])).count(),
    )


def criar_usuario_admin(db: Session, dados: AdminCriarUsuarioRequest) -> Usuario:
    existente = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if existente:
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    novo = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=get_password_hash(dados.senha),
        perfil=dados.perfil,
        tipo_plano=dados.tipo_plano,
        permissoes=[p.value for p in dados.permissoes],
        ativo=True,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    novo.broker_count = 0
    return novo


def list_users(db: Session, perfil: str | None, q: str | None) -> list:
    query = db.query(Usuario)
    if perfil:
        query = query.filter(Usuario.perfil == perfil)
    if q:
        query = query.filter((Usuario.nome.ilike(f"%{q}%")) | (Usuario.email.ilike(f"%{q}%")))

    users = query.all()
    result = []
    for user in users:
        broker_count = 0
        if user.perfil == "imobiliaria":
            broker_count = db.query(Usuario).filter(Usuario.imobiliaria_id == user.id).count()
        result.append({**user.__dict__, "broker_count": broker_count})
    return result


def update_user(db: Session, user_id: int, user_in: UserAdminUpdate) -> dict:
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    for key, value in user_in.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    broker_count = 0
    if db_user.perfil == "imobiliaria":
        broker_count = db.query(Usuario).filter(Usuario.imobiliaria_id == db_user.id).count()
    return {**db_user.__dict__, "broker_count": broker_count}
