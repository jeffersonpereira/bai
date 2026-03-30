from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.schemas.match import (
    BuyerProfileBase, BuyerProfileResponse,
    UserMatchResponse, ScoredPropertyMatch,
)
from app.services import match_service
from .auth import get_current_user, get_current_full_access

router = APIRouter(prefix="/match", tags=["matchmaking"])


@router.get("/profiles", response_model=List[BuyerProfileResponse])
def get_my_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return match_service.get_profiles(db, current_user.id)


@router.get("/profiles/{profile_id}", response_model=BuyerProfileResponse)
def get_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return match_service.get_profile(db, profile_id, current_user.id)


@router.post("/profiles", response_model=BuyerProfileResponse)
def create_profile(
    profile_in: BuyerProfileBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return match_service.create_profile(db, profile_in, current_user.id)


@router.put("/profiles/{profile_id}", response_model=BuyerProfileResponse)
def update_profile(
    profile_id: int,
    profile_in: BuyerProfileBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return match_service.update_profile(db, profile_id, profile_in, current_user.id)


@router.delete("/profiles/{profile_id}")
def delete_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return match_service.delete_profile(db, profile_id, current_user.id)


@router.get("/properties/{profile_id}/scored", response_model=List[ScoredPropertyMatch])
def get_scored_properties(
    profile_id: int,
    min_score: int = Query(40, ge=0, le=100, description="Score mínimo para incluir"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna imóveis com score e critérios correspondidos para exibição no dashboard do comprador."""
    return match_service.get_scored_matching_properties(db, profile_id, current_user.id, min_score, limit)


@router.get("/properties/{profile_id}", response_model=List[ScoredPropertyMatch])
def get_matching_properties(
    profile_id: int,
    expanded: bool = Query(False, description="Busca expandida com critérios relaxados"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return match_service.get_scored_matching_properties(
        db, profile_id, current_user.id,
        min_score=20 if expanded else 40,
        limit=50,
    )


@router.get("/buyers/{property_id}", response_model=List[UserMatchResponse])
def get_matching_buyers(
    property_id: int,
    current_user: User = Depends(get_current_full_access),
    db: Session = Depends(get_db),
):
    """Lista compradores cujos perfis combinam com o imóvel (visão do corretor)."""
    return match_service.get_matching_buyers(db, property_id, current_user)
