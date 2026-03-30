from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.models.property import Property
from app.models.lead import Lead
from app.schemas.user import UserAdminUpdate
from app.schemas.admin import AdminStats


def get_stats(db: Session) -> AdminStats:
    one_week_ago = datetime.now() - timedelta(days=7)
    return AdminStats(
        total_users=db.query(User).count(),
        total_agencies=db.query(User).filter(User.role == "agency").count(),
        total_brokers=db.query(User).filter(User.role == "broker").count(),
        total_properties=db.query(Property).count(),
        total_leads=db.query(Lead).count(),
        recent_registrations=db.query(User).filter(User.created_at >= one_week_ago).count(),
    )


def list_users(db: Session, role: str | None, q: str | None) -> list:
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if q:
        query = query.filter((User.name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")))

    users = query.all()
    result = []
    for user in users:
        broker_count = 0
        if user.role == "agency":
            broker_count = db.query(User).filter(User.parent_id == user.id).count()
        result.append({**user.__dict__, "broker_count": broker_count})
    return result


def update_user(db: Session, user_id: int, user_in: UserAdminUpdate) -> dict:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    for key, value in user_in.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    broker_count = 0
    if db_user.role == "agency":
        broker_count = db.query(User).filter(User.parent_id == db_user.id).count()
    return {**db_user.__dict__, "broker_count": broker_count}
