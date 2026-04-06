from fastapi import APIRouter, Depends, Query, BackgroundTasks, Body
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.schemas.property import (
    PropertyCreate, PropertyResponse, PaginatedPropertiesResponse,
    AvailabilityCreate, AvailabilityResponse,
)
from app.services import property_service
from .auth import get_current_user, get_current_agency, get_current_full_access, get_current_admin

router = APIRouter(prefix="/properties", tags=["properties"], redirect_slashes=False)


@router.get("/locations")
def get_locations(db: Session = Depends(get_db)):
    return property_service.get_locations(db)


@router.get("/", response_model=PaginatedPropertiesResponse)
def get_properties(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    city: str | None = Query(None),
    neighborhood: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    min_area: float | None = Query(None),
    max_area: float | None = Query(None),
    bedrooms: int | None = Query(None),
    bathrooms: int | None = Query(None),
    garage_spaces: int | None = Query(None),
    financing_eligible: bool | None = Query(None),
    source: str | None = Query(None),
    listing_type: str | None = Query(None),
    property_type: List[str] | None = Query(None),
    is_star: bool | None = Query(None),
    sort: str | None = Query(None),
):
    return property_service.get_properties(
        db=db, page=page, limit=limit, city=city, neighborhood=neighborhood,
        min_price=min_price, max_price=max_price, min_area=min_area, max_area=max_area,
        bedrooms=bedrooms, bathrooms=bathrooms, garage_spaces=garage_spaces,
        financing_eligible=financing_eligible, source=source, listing_type=listing_type,
        property_type=property_type, is_star=is_star, sort=sort,
    )


@router.get("/user/me", response_model=PaginatedPropertiesResponse)
def get_my_properties(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    title: str | None = Query(None),
    status: str | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    return property_service.get_my_properties(db, current_user, page=page, limit=limit, title=title, status=status)


@router.get("/user/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return property_service.get_property_stats(db, current_user)


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    return property_service.get_property(db, property_id)


@router.post("/{property_id}/view")
def record_property_view(property_id: int, db: Session = Depends(get_db)):
    views = property_service.increment_views_count(db, property_id)
    return {"views_count": views}


@router.post("/", response_model=PropertyResponse)
def create_property(
    property_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return property_service.create_property(db, property_in, current_user)


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    property_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return property_service.update_property(db, property_id, property_in, current_user)


@router.patch("/{property_id}/status", response_model=PropertyResponse)
def change_property_status(
    property_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return property_service.change_status(db, property_id, status, current_user)


@router.post("/{property_id}/assign")
def assign_broker(
    property_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_agency),
):
    return property_service.assign_broker(db, property_id, user_id, current_user)


@router.delete("/{property_id}/assign/{user_id}", dependencies=[Depends(get_current_agency)])
def unassign_broker(
    property_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    return property_service.unassign_broker(db, property_id, user_id)


@router.get("/{property_id}/availability", response_model=List[AvailabilityResponse])
def get_property_availability(property_id: int, db: Session = Depends(get_db)):
    return property_service.get_availability(db, property_id)


@router.post("/{property_id}/availability", response_model=List[AvailabilityResponse])
def update_property_availability(
    property_id: int,
    availability_in: List[AvailabilityCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return property_service.update_availability(db, property_id, availability_in, current_user)


@router.post("/price-analysis")
def price_analysis(
    price: float = Body(...),
    area: float | None = Body(None),
    city: str | None = Body(None),
    neighborhood: str | None = Body(None),
    bedrooms: int | None = Body(None),
    listing_type: str | None = Body(None),
    atributos_extras: dict | None = Body(None),
    db: Session = Depends(get_db),
):
    return property_service.analyze_price(
        db, price, area, city, neighborhood, bedrooms, listing_type, atributos_extras
    )


