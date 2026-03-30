from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse, PaginatedLeads, ActivityCreate, ActivityResponse
from app.schemas.owner import OwnerCreate, OwnerResponse, PaginatedOwners
from app.schemas.mandate import MandateCreate
from app.services import crm_service
from .auth import get_current_full_access

router = APIRouter(prefix="/crm", tags=["crm"])


# --- OWNERS ---

@router.post("/owners", response_model=OwnerResponse)
def create_owner(
    owner_in: OwnerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return crm_service.create_owner(db, owner_in, current_user.id)


@router.put("/owners/{owner_id}", response_model=OwnerResponse)
def update_owner(
    owner_id: int,
    owner_in: OwnerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return crm_service.update_owner(db, owner_id, owner_in, current_user)


@router.get("/owners", response_model=PaginatedOwners)
def get_owners(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
):
    return crm_service.get_owners(db, current_user, skip, limit, search)


# --- LEADS ---

@router.get("/leads", response_model=PaginatedLeads)
def get_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
):
    return crm_service.get_leads(db, current_user, skip, limit, search)


@router.post("/leads", response_model=LeadResponse)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return crm_service.create_lead(db, lead_in, current_user.id)


@router.post("/leads/public", response_model=LeadResponse)
def create_lead_public(lead_in: LeadCreate, db: Session = Depends(get_db)):
    return crm_service.create_public_lead(db, lead_in)


@router.patch("/leads/{lead_id}/status")
def update_lead_status(
    lead_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return crm_service.update_lead_status(db, lead_id, status, current_user)


# --- MANDATES ---

@router.post("/mandates")
def create_mandate(
    mandate_in: MandateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return crm_service.create_mandate(db, mandate_in, current_user.id)


# --- ACTIVITIES ---

@router.post("/leads/{lead_id}/activities", response_model=ActivityResponse)
def create_lead_activity(
    lead_id: int,
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return crm_service.add_activity(db, lead_id, activity_in, current_user)


@router.get("/leads/{lead_id}/activities", response_model=List[ActivityResponse],
            dependencies=[Depends(get_current_full_access)])
def get_lead_activities(lead_id: int, db: Session = Depends(get_db)):
    return crm_service.get_activities(db, lead_id)
