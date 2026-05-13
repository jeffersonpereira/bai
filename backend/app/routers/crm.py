from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.lead import LeadCriar, LeadResposta, PaginatedLeads, ActivityCreate, ActivityResponse
from app.schemas.proprietario import ProprietarioCriar, ProprietarioResposta, PaginatedOwners
from app.schemas.mandato import MandatoCriar
from app.services import crm_service
from app.core.deps import get_current_full_access, get_current_broker_or_above
from app.core.limiter import limiter
from app.core.quota import verificar_quota_leads

router = APIRouter(prefix="/crm", tags=["crm"])


# --- OWNERS ---

@router.post("/owners", response_model=ProprietarioResposta)
def create_owner(
    owner_in: ProprietarioCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_full_access),
):
    return crm_service.create_owner(db, owner_in, current_user.id)


@router.get("/owners/{owner_id}/portfolio")
def get_owner_portfolio(
    owner_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_full_access),
):
    return crm_service.get_owner_portfolio(db, owner_id, current_user)


@router.put("/owners/{owner_id}", response_model=ProprietarioResposta)
def update_owner(
    owner_id: int,
    owner_in: ProprietarioCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_full_access),
):
    return crm_service.update_owner(db, owner_id, owner_in, current_user)


@router.get("/owners", response_model=PaginatedOwners)
def get_owners(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_full_access),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
):
    return crm_service.get_owners(db, current_user, skip, limit, search)


# --- LEADS ---

@router.get("/leads/kanban")
def get_leads_kanban(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_broker_or_above),
):
    return crm_service.get_leads_kanban(db, current_user)


@router.get("/leads", response_model=PaginatedLeads)
def get_leads(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_broker_or_above),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    situacao: str | None = Query(None),
):
    return crm_service.get_leads(db, current_user, skip, limit, search, situacao)


@router.post("/leads", response_model=LeadResposta)
def create_lead(
    lead_in: LeadCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_broker_or_above),
):
    verificar_quota_leads(db, current_user)
    return crm_service.create_lead(db, lead_in, current_user.id)


@router.post("/leads/public", response_model=LeadResposta)
@limiter.limit("20/minute")
def create_lead_public(request: Request, lead_in: LeadCriar, db: Session = Depends(get_db)):
    return crm_service.create_public_lead(db, lead_in)


@router.patch("/leads/{lead_id}/status")
def update_lead_status(
    lead_id: int,
    situacao: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_broker_or_above),
):
    return crm_service.update_lead_status(db, lead_id, situacao, current_user)


@router.post("/leads/{lead_id}/claim")
def claim_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_broker_or_above),
):
    return crm_service.claim_lead(db, lead_id, current_user)


# --- MANDATES ---

@router.post("/mandates")
def create_mandate(
    mandate_in: MandatoCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_full_access),
):
    return crm_service.create_mandate(db, mandate_in, current_user.id)


# --- ACTIVITIES ---

@router.post("/leads/{lead_id}/activities", response_model=ActivityResponse)
def create_lead_activity(
    lead_id: int,
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_broker_or_above),
):
    return crm_service.add_activity(db, lead_id, activity_in, current_user)


@router.get("/leads/{lead_id}/activities", response_model=List[ActivityResponse],
            dependencies=[Depends(get_current_broker_or_above)])
def get_lead_activities(lead_id: int, db: Session = Depends(get_db)):
    return crm_service.get_activities(db, lead_id)
