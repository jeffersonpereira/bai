"""
Rastreia quais imóveis cada comprador já visualizou.
Permite ao comprador ver apenas imóveis novos (ainda não vistos).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.services import visualizacoes_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/visualizacoes", tags=["visualizacoes"])


@router.post("/properties/{property_id}")
def mark_as_viewed(
    property_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return visualizacoes_service.mark_as_viewed(db, property_id, current_user)


@router.get("/properties/new")
def get_new_properties(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    return visualizacoes_service.get_new_properties(db, current_user, limit)


@router.get("/properties/seen")
def get_seen_properties(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return visualizacoes_service.get_seen_properties(db, current_user)
