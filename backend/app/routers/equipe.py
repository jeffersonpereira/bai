from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import BrokerCreate, UsuarioResposta
from app.services import equipe_service
from app.core.deps import get_current_agency

router = APIRouter(prefix="/equipe", tags=["equipe"])


@router.post("/brokers", response_model=UsuarioResposta)
def add_broker(
    broker_in: BrokerCreate,
    current_user: Usuario = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    return equipe_service.add_broker(db, broker_in, current_user)


@router.get("/brokers", response_model=List[UsuarioResposta])
def list_brokers(
    current_user: Usuario = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    return equipe_service.list_brokers(db, current_user)
