"""
Rastreia quais imóveis cada comprador já visualizou.
Permite ao comprador ver apenas imóveis *novos* (ainda não vistos).
Spec: interesses_compradores / separação entre imóveis vistos e novos publicados.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import not_, exists

from app.db.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.property_view import PropertyView

router = APIRouter(prefix="/views", tags=["views"])


def _get_current_user_dep():
    from .auth import get_current_user
    return Depends(get_current_user)


from .auth import get_current_user


@router.post("/properties/{property_id}")
def mark_as_viewed(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra que o usuário visualizou um imóvel (upsert — idempotente)."""
    existing = db.query(PropertyView).filter(
        PropertyView.user_id == current_user.id,
        PropertyView.property_id == property_id,
    ).first()
    if not existing:
        db.add(PropertyView(user_id=current_user.id, property_id=property_id))
        db.commit()
    return {"viewed": True, "property_id": property_id}


@router.get("/properties/new")
def get_new_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """
    Retorna imóveis ativos que o usuário ainda NÃO visualizou.
    Spec: 'separar imóveis já visualizados dos novos publicados'.
    """
    viewed_subquery = db.query(PropertyView.property_id).filter(
        PropertyView.user_id == current_user.id
    ).subquery()

    new_props = (
        db.query(Property)
        .filter(
            Property.status == "active",
            not_(Property.id.in_(viewed_subquery)),
        )
        .order_by(Property.created_at.desc())
        .limit(limit)
        .all()
    )
    return new_props


@router.get("/properties/seen")
def get_seen_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista imóveis que o usuário já visualizou."""
    views = (
        db.query(PropertyView)
        .filter(PropertyView.user_id == current_user.id)
        .order_by(PropertyView.viewed_at.desc())
        .all()
    )
    return [
        {"property_id": v.property_id, "viewed_at": v.viewed_at}
        for v in views
    ]
