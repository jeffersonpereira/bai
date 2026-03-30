import time as time_module
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from typing import List

from app.models.property import Property
from app.models.user import User
from app.models.assignment import PropertyAssignment
from app.models.media import PropertyMedia
from app.models.availability import PropertyAvailability
from app.schemas.property import PropertyCreate, PaginatedPropertiesResponse

# Cache simples para localização — válido para single-worker dev
_LOCATIONS_CACHE: dict = {"data": None, "expiry": 0}
_CACHE_TTL = 300  # 5 minutos


def get_locations(db: Session) -> dict:
    now = time_module.time()
    if _LOCATIONS_CACHE["data"] and now < _LOCATIONS_CACHE["expiry"]:
        return _LOCATIONS_CACHE["data"]

    rows = db.query(Property.city, Property.neighborhood).filter(
        Property.status == "active",
        Property.city.isnot(None),
        Property.neighborhood.isnot(None),
    ).distinct().all()

    locations: dict = {}
    for city, neighborhood in rows:
        c = city.strip()
        n = neighborhood.strip()
        if not c or not n:
            continue
        if c not in locations:
            locations[c] = set()
        locations[c].add(n)

    result = {c: sorted(list(ns)) for c, ns in locations.items()}
    _LOCATIONS_CACHE["data"] = result
    _LOCATIONS_CACHE["expiry"] = now + _CACHE_TTL
    return result


def get_properties(
    db: Session,
    page: int,
    limit: int,
    city: str | None,
    neighborhood: str | None,
    min_price: float | None,
    max_price: float | None,
    min_area: float | None,
    max_area: float | None,
    bedrooms: int | None,
    bathrooms: int | None,
    garage_spaces: int | None,
    financing_eligible: bool | None,
    source: str | None,
    listing_type: str | None,
    property_type: List[str] | None,
    is_star: bool | None = None,
) -> PaginatedPropertiesResponse:
    query = db.query(Property).filter(Property.status == "active")

    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if neighborhood:
        terms = [t.strip() for t in neighborhood.split(",") if t.strip()]
        if terms:
            query = query.filter(or_(*[Property.neighborhood.ilike(f"%{t}%") for t in terms]))
    if min_price is not None:
        query = query.filter(Property.price >= min_price)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)
    if min_area is not None:
        query = query.filter(Property.area >= min_area)
    if max_area is not None:
        query = query.filter(Property.area <= max_area)
    if bedrooms is not None:
        query = query.filter(Property.bedrooms == bedrooms)
    if bathrooms is not None:
        query = query.filter(Property.bathrooms == bathrooms)
    if garage_spaces is not None:
        query = query.filter(Property.garage_spaces >= garage_spaces)
    if financing_eligible:
        query = query.filter(Property.financing_eligible == True)
    if source:
        query = query.filter(Property.source == source)
    if listing_type:
        query = query.filter(Property.listing_type == listing_type)
    if property_type:
        query = query.filter(Property.property_type.in_(property_type))
    if is_star is not None:
        query = query.filter(Property.is_star == is_star)

    total = query.count()
    skip = (page - 1) * limit
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total, "page": page, "limit": limit}


def get_property(db: Session, property_id: int) -> Property:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return prop


def get_my_properties(db: Session, current_user: User) -> List[Property]:
    query = db.query(Property)
    if current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        return query.filter(Property.owner_id.in_(broker_ids)).all()
    if current_user.role == "broker" and current_user.parent_id is not None:
        return current_user.assigned_properties
    return query.filter(Property.owner_id == current_user.id).all()


def create_property(db: Session, property_in: PropertyCreate, current_user: User) -> Property:
    property_data = property_in.model_dump(exclude={"media", "availability_windows"})
    property_data["owner_id"] = current_user.id
    db_property = Property(**property_data)
    db.add(db_property)
    try:
        db.commit()
        db.refresh(db_property)
        for item in property_in.media:
            db.add(PropertyMedia(property_id=db_property.id, url=item.url, media_type=item.media_type))
        for item in property_in.availability_windows:
            db.add(PropertyAvailability(property_id=db_property.id, **item.model_dump()))
        db.commit()
        db.refresh(db_property)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar imóvel: {str(e)}")
    return db_property


def update_property(db: Session, property_id: int, property_in: PropertyCreate, current_user: User) -> Property:
    db_property = get_property(db, property_id)

    if db_property.owner_id != current_user.id and current_user.role != "agency":
        raise HTTPException(status_code=403, detail="Sem permissão para editar este imóvel")

    update_data = property_in.model_dump(exclude={"media", "availability_windows"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)

    db.query(PropertyMedia).filter(PropertyMedia.property_id == property_id).delete()
    for item in property_in.media:
        db.add(PropertyMedia(property_id=db_property.id, url=item.url, media_type=item.media_type))

    db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).delete()
    for item in property_in.availability_windows:
        db.add(PropertyAvailability(property_id=db_property.id, **item.model_dump()))

    try:
        db.commit()
        db.refresh(db_property)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar imóvel: {str(e)}")
    return db_property


def change_status(db: Session, property_id: int, status: str, current_user: User) -> Property:
    valid_statuses = ["active", "archived", "pending"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status inválido")
    prop = get_property(db, property_id)
    prop.status = status
    db.commit()
    db.refresh(prop)
    return prop


def assign_broker(db: Session, property_id: int, user_id: int, current_user: User) -> dict:
    prop = get_property(db, property_id)
    broker = db.query(User).filter(User.id == user_id, User.parent_id == current_user.id).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Corretor não encontrado na equipe")
    assignment = PropertyAssignment(property_id=property_id, user_id=user_id)
    db.merge(assignment)
    db.commit()
    return {"message": f"Imóvel atribuído a {broker.name}"}


def unassign_broker(db: Session, property_id: int, user_id: int) -> dict:
    assignment = db.query(PropertyAssignment).filter(
        PropertyAssignment.property_id == property_id,
        PropertyAssignment.user_id == user_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Atribuição não encontrada")
    db.delete(assignment)
    db.commit()
    return {"message": "Atribuição removida"}


def get_availability(db: Session, property_id: int):
    return db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).all()


def update_availability(db: Session, property_id: int, availability_in: list, current_user: User):
    prop = get_property(db, property_id)
    if prop.owner_id != current_user.id and current_user.role != "agency":
        is_assigned = any(b.id == current_user.id for b in prop.assigned_brokers)
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Acesso negado")

    db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).delete()
    for item in availability_in:
        db.add(PropertyAvailability(**item.model_dump(), property_id=property_id))
    db.commit()
    return db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).all()
