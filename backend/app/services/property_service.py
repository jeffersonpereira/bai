import time as time_module
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
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
    sort: str | None = None,
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
        query = query.filter(Property.bedrooms >= bedrooms)
    if bathrooms is not None:
        query = query.filter(Property.bathrooms >= bathrooms)
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

    # Melhoria N+1: Carrega mídias antecipadamente
    query = query.options(joinedload(Property.media))
    
    if sort == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Property.price.desc())
    elif sort == "views":
        query = query.order_by(Property.views_count.desc(), Property.created_at.desc())
    else:
        query = query.order_by(Property.created_at.desc())
    
    total = query.count()
    skip = (page - 1) * limit
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total, "page": page, "limit": limit}


def increment_views_count(db: Session, property_id: int) -> int:
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Simple atomic increment (if not using bulk update mapping)
    property_obj.views_count += 1
    db.commit()
    db.refresh(property_obj)
    return property_obj.views_count


def get_property(db: Session, property_id: int) -> Property:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return prop


def get_my_properties(
    db: Session, 
    current_user: User, 
    page: int = 1, 
    limit: int = 20,
    title: str | None = None,
    status: str | None = None
) -> PaginatedPropertiesResponse:
    query = db.query(Property).options(joinedload(Property.media))
    
    if current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        query = query.filter(Property.owner_id.in_(broker_ids))
    elif current_user.role == "broker" and current_user.parent_id is not None:
        query = query.join(Property.assigned_brokers).filter(User.id == current_user.id)
    else:
        query = query.filter(Property.owner_id == current_user.id)

    if title:
        query = query.filter(Property.title.ilike(f"%{title}%"))
    if status:
        query = query.filter(Property.status == status)

    total = query.count()
    skip = (page - 1) * limit
    items = query.order_by(Property.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"items": items, "total": total, "page": page, "limit": limit}


def get_property_stats(db: Session, current_user: User) -> dict:
    """Retorna contadores rápidos para o dashboard sem carregar objetos pesados."""
    query = db.query(Property)
    
    if current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        query = query.filter(Property.owner_id.in_(broker_ids))
    elif current_user.role == "broker" and current_user.parent_id is not None:
        query = query.join(Property.assigned_brokers).filter(User.id == current_user.id)
    else:
        query = query.filter(Property.owner_id == current_user.id)

    total_properties = query.count()
    
    # Outros stats rápidos se necessário
    return {
        "total_properties": total_properties,
    }


def create_property(db: Session, property_in: PropertyCreate, current_user: User) -> Property:
    if current_user.role == "user" and (getattr(property_in, "status", "active") == "active"):
        active_count = db.query(Property).filter(
            Property.owner_id == current_user.id, 
            Property.status == "active"
        ).count()
        if active_count >= 1:
            raise HTTPException(
                status_code=403, 
                detail="Você já possui um anúncio ativo. Quem vende por conta própria possui o limite de 1 anúncio gratuito. Pause seu anúncio atual ou faça assinatura para adicionar mais."
            )

    property_data = property_in.model_dump(exclude={"media", "availability_windows"})
    property_data["owner_id"] = current_user.id
    db_property = Property(**property_data)
    db.add(db_property)
    try:
        db.flush()  # Obtém o ID sem commitar
        for item in property_in.media:
            db.add(PropertyMedia(property_id=db_property.id, url=item.url, media_type=item.media_type))
        for item in property_in.availability_windows:
            db.add(PropertyAvailability(property_id=db_property.id, **item.model_dump()))
        db.commit()  # Único commit — tudo ou nada
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
    valid_statuses = ["active", "archived", "pending", "sold", "rented"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status inválido")
    prop = get_property(db, property_id)
    if prop.owner_id != current_user.id and current_user.role not in ("agency", "admin"):
        raise HTTPException(status_code=403, detail="Sem permissão para alterar status deste imóvel")
        
    if status == "active" and prop.status != "active" and current_user.role == "user":
        active_count = db.query(Property).filter(
            Property.owner_id == current_user.id, 
            Property.status == "active"
        ).count()
        if active_count >= 1:
            raise HTTPException(
                status_code=403, 
                detail="Você já possui um anúncio ativo. Quem vende por conta própria possui o limite de 1 anúncio gratuito. Pause seu anúncio atual para reativar este."
            )

    prop.status = status
    db.commit()
    db.refresh(prop)
    return prop


# Impacto estimado de cada atributo no preço/m² (percentual de valorização)
_ATRIBUTO_PREMIUM: dict[str, float] = {
    "piscina": 0.08,
    "academia": 0.04,
    "churrasqueira": 0.03,
    "portaria_24h": 0.05,
    "elevador": 0.04,
    "varanda": 0.03,
    "energia_solar": 0.04,
    "mobiliado": 0.06,
    "ar_condicionado": 0.03,
    "pet_friendly": 0.02,
}


def _atributos_premium_factor(atributos: dict | None) -> float:
    """Retorna fator multiplicador baseado nos atributos do imóvel (ex: 1.08 para piscina)."""
    if not atributos:
        return 1.0
    factor = 1.0
    for key, pct in _ATRIBUTO_PREMIUM.items():
        if atributos.get(key):
            factor += pct
    return factor


def analyze_price(
    db: Session,
    price: float,
    area: float | None,
    city: str | None,
    neighborhood: str | None,
    bedrooms: int | None,
    listing_type: str | None,
    atributos_extras: dict | None = None,
) -> dict:
    if not area or area <= 0:
        return {"status": "insufficient_data", "message": "Área necessária para análise de preço"}

    base_query = db.query(Property).filter(
        Property.status == "active",
        Property.area.isnot(None),
        Property.area > 0,
    )
    if listing_type:
        base_query = base_query.filter(Property.listing_type == listing_type)
    if city:
        base_query = base_query.filter(Property.city.ilike(f"%{city}%"))

    # Tenta primeiro com bairro + quartos próximos
    query = base_query
    if neighborhood:
        query = query.filter(Property.neighborhood.ilike(f"%{neighborhood}%"))
    if bedrooms is not None:
        query = query.filter(Property.bedrooms.between(max(0, bedrooms - 1), bedrooms + 1))
    comparables = query.limit(100).all()

    # Fallback 1: só cidade + quartos
    if not comparables and bedrooms is not None:
        comparables = base_query.filter(
            Property.bedrooms.between(max(0, bedrooms - 1), bedrooms + 1)
        ).limit(100).all()

    # Fallback 2: só cidade
    if not comparables:
        comparables = base_query.limit(100).all()

    if not comparables:
        return {"status": "insufficient_data", "message": "Sem dados suficientes para esta localidade"}

    price_per_m2_list = [p.price / p.area for p in comparables if p.area and p.area > 0]
    if not price_per_m2_list:
        return {"status": "insufficient_data", "message": "Sem dados suficientes para análise"}

    avg_price_per_m2 = sum(price_per_m2_list) / len(price_per_m2_list)
    my_price_per_m2 = price / area

    # Ajusta a média de mercado considerando os atributos declarados
    premium_factor = _atributos_premium_factor(atributos_extras)
    adjusted_avg = avg_price_per_m2 * premium_factor
    variation_pct = (my_price_per_m2 - adjusted_avg) / adjusted_avg * 100

    if variation_pct > 10:
        signal = "acima"
    elif variation_pct < -10:
        signal = "abaixo"
    else:
        signal = "na_media"

    active_attrs = [k for k, v in (atributos_extras or {}).items() if v]

    return {
        "status": "ok",
        "signal": signal,
        "variation_pct": round(variation_pct, 1),
        "my_price_per_m2": round(my_price_per_m2, 2),
        "avg_price_per_m2": round(avg_price_per_m2, 2),
        "adjusted_avg_price_per_m2": round(adjusted_avg, 2),
        "premium_factor": round(premium_factor, 3),
        "active_attributes": active_attrs,
        "comparables_count": len(comparables),
    }


def assign_broker(db: Session, property_id: int, user_id: int, current_user: User) -> dict:
    get_property(db, property_id)  # valida existência
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
