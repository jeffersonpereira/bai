from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Body
import time
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from datetime import datetime, time
from typing import List
from ..db.database import get_db
from ..models.property import Property
from .auth import get_current_user, get_current_agency, get_current_full_access
from ..models.user import User
from ..models.assignment import PropertyAssignment
from ..models.media import PropertyMedia
from ..models.availability import PropertyAvailability

router = APIRouter(prefix="/properties", tags=["properties"])

# Cache simples para localização (evita processar milhares de linhas a cada request)
_LOCATIONS_CACHE = {
    "data": None,
    "expiry": 0
}
CACHE_TTL = 300 # 5 minutos

@router.get("/locations")
def get_locations(db: Session = Depends(get_db)):
    global _LOCATIONS_CACHE
    now = time.time()
    
    if _LOCATIONS_CACHE["data"] and now < _LOCATIONS_CACHE["expiry"]:
        return _LOCATIONS_CACHE["data"]

    properties = db.query(Property.city, Property.neighborhood).filter(
        Property.status == "active",
        Property.city != None,
        Property.neighborhood != None
    ).distinct().all()
    
    locations = {}
    for city, neighborhood in properties:
        c = city.strip()
        n = neighborhood.strip()
        if not c or not n: continue
        if c not in locations:
            locations[c] = set()
        locations[c].add(n)
        
    result = {c: sorted(list(ns)) for c, ns in locations.items()}
    return result

class PropertyMediaBase(BaseModel):
    url: str
    media_type: str # 'image', 'video', 'document'
    class Config:
        from_attributes = True

class PropertyCreate(BaseModel):
    title: str
    description: str | None = None
    price: float
    area: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    garage_spaces: int | None = 0
    financing_eligible: bool | None = False 
    city: str | None = None
    neighborhood: str | None = None
    full_address: str | None = None
    source_url: str | None = None
    image_url: str | None = None
    source: str | None = None
    listing_type: str | None = "venda"
    property_type: str | None = "apartamento"
    status: str | None = "active"
    actual_owner_id: int | None = None
    commission_percentage: float | None = None
    media: List[PropertyMediaBase] = []
    availability_windows: List[AvailabilityCreate] = []

class UserBase(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    role: str | None = None
    phone: str | None = None
    creci: str | None = None
    class Config:
        from_attributes = True

class PropertyOwnerBase(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    class Config:
        from_attributes = True

class AvailabilityCreate(BaseModel):
    day_of_week: int # 0-6
    start_time: time
    end_time: time

class AvailabilityResponse(AvailabilityCreate):
    id: int
    class Config:
        from_attributes = True

class PropertyResponse(PropertyCreate):
    id: int
    owner_id: int | None = None
    owner: UserBase | None = None
    actual_owner_id: int | None = None
    actual_owner: PropertyOwnerBase | None = None
    full_address: str | None = None
    created_at: datetime | None = None
    owner_name: str | None = None
    media: List[PropertyMediaBase] = []
    availability_windows: List['AvailabilityResponse'] = []
    class Config:
        from_attributes = True

class PaginatedPropertiesResponse(BaseModel):
    items: List[PropertyResponse]
    total: int
    page: int
    limit: int

@router.get("/", response_model=PaginatedPropertiesResponse)
def get_properties(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    city: str | None = Query(None, description="Filtro de cidade"),
    neighborhood: str | None = Query(None, description="Filtro de bairro"),
    min_price: float | None = Query(None, description="Preço mínimo"),
    max_price: float | None = Query(None, description="Preço máximo"),
    min_area: float | None = Query(None, description="Área mínima"),
    max_area: float | None = Query(None, description="Área máxima"),
    bedrooms: int | None = Query(None, description="Número de quartos"),
    bathrooms: int | None = Query(None, description="Número de banheiros"),
    garage_spaces: int | None = Query(None, description="Vagas mínimas de garagem"),
    financing_eligible: bool | None = Query(None, description="Apenas aceita financiamento"),
    source: str | None = Query(None, description="Origem do anúncio"),
    listing_type: str | None = Query(None, description="venda, aluguel, temporada"),
    property_type: List[str] | None = Query(None, description="casa, apartamento, etc"),
):
    query = db.query(Property)
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
        query = query.filter(Property.financing_eligible == 1)
    if source:
        query = query.filter(Property.source == source)
    if listing_type:
        query = query.filter(Property.listing_type == listing_type)
    if property_type:
        query = query.filter(Property.property_type.in_(property_type))
    
    query = query.filter(Property.status == "active")
    
    total = query.count()
    skip = (page - 1) * limit
    properties = query.offset(skip).limit(limit).all()
    
    return {
        "items": properties,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return db_property

@router.get("/user/me", response_model=List[PropertyResponse])
def get_my_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Property)
    if current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        return query.filter(Property.owner_id.in_(broker_ids)).all()
    
    if current_user.role == "broker" and current_user.parent_id is not None:
        return current_user.assigned_properties

    return query.filter(Property.owner_id == current_user.id).all()

@router.post("/", response_model=PropertyResponse)
def create_property(
    property_in: PropertyCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    property_data = property_in.model_dump(exclude={"media", "availability_windows"})
    property_data["owner_id"] = current_user.id
    db_property = Property(**property_data)
    db.add(db_property)
    try:
        db.commit()
        db.refresh(db_property)
        if property_in.media:
            for item in property_in.media:
                media_item = PropertyMedia(
                    property_id=db_property.id,
                    url=item.url,
                    media_type=item.media_type
                )
                db.add(media_item)
        
        if property_in.availability_windows:
            for item in property_in.availability_windows:
                avail = PropertyAvailability(
                    property_id=db_property.id,
                    **item.model_dump()
                )
                db.add(avail)
                
        db.commit()
        db.refresh(db_property)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar imóvel: {str(e)}")
    return db_property

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    property_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    if db_property.owner_id != current_user.id and current_user.role != 'agency':
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar este imóvel")

    update_data = property_in.model_dump(exclude={"media", "availability_windows"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)
    
    db.query(PropertyMedia).filter(PropertyMedia.property_id == property_id).delete()
    if property_in.media:
        for item in property_in.media:
            media_item = PropertyMedia(
                property_id=db_property.id,
                url=item.url,
                media_type=item.media_type
            )
            db.add(media_item)

    db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).delete()
    if property_in.availability_windows:
        for item in property_in.availability_windows:
            avail = PropertyAvailability(
                property_id=db_property.id,
                **item.model_dump()
            )
            db.add(avail)

    try:
        db.commit()
        db.refresh(db_property)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar imóvel: {str(e)}")

    return db_property

@router.post("/scrape")
async def trigger_scraping(background_tasks: BackgroundTasks):
    from app.scraper.core import ImovelScraper
    from app.db.database import SessionLocal
    from app.models.property import Property
    import asyncio
    
    # URLs reais para ImovelWeb e OLX
    URLS_CONFIG = [
        {"url": "https://www.imovelweb.com.br/apartamentos-venda-sao-paulo-sp.html", "source": "imovelweb"},
        {"url": "https://www.imovelweb.com.br/casas-venda-sao-paulo-sp.html", "source": "imovelweb"},
        {"url": "https://www.olx.com.br/imoveis/venda/estado-sp/sao-paulo-e-regiao", "source": "olx"},
        {"url": "https://www.olx.com.br/imoveis/venda/estado-rj/rio-de-janeiro-e-regiao", "source": "olx"}
    ]
    
    async def bg_scrape():
        scraper = ImovelScraper()
        db = SessionLocal()
        try:
            for config in URLS_CONFIG:
                url = config["url"]
                source = config["source"]
                html = await scraper.fetch_html(url)
                if html:
                    extracted = []
                    if source == "imovelweb":
                        extracted = scraper.parse_imovelweb_data(html)
                    elif source == "olx":
                        extracted = scraper.parse_olx_data(html)
                    
                    for item in extracted:
                        # Evitar duplicatas pela URL
                        exists = db.query(Property).filter(Property.source_url == item["source_url"]).first()
                        if not exists and item["source_url"]:
                            db.add(Property(**item))
                    db.commit()
                # Pausa para evitar bloqueio
                await asyncio.sleep(3)
        except Exception as e:
            print(f"Erro no job de scraping: {e}")
            db.rollback()
        finally:
            db.close()

    background_tasks.add_task(bg_scrape)
    return {"message": "Job de scraping (ImovelWeb & OLX) foi iniciado em segundo plano!"}

@router.post("/{property_id}/assign")
def assign_broker(
    property_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_agency)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    broker = db.query(User).filter(User.id == user_id, User.parent_id == current_user.id).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Corretor não encontrado na equipe")

    assignment = PropertyAssignment(property_id=property_id, user_id=user_id)
    db.merge(assignment)
    db.commit()
    return {"message": f"Imóvel atribuído a {broker.name}"}

@router.delete("/{property_id}/assign/{user_id}")
def unassign_broker(
    property_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_agency)
):
    assignment = db.query(PropertyAssignment).filter(
        PropertyAssignment.property_id == property_id,
        PropertyAssignment.user_id == user_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Atribuição não encontrada")
        
    db.delete(assignment)
    db.commit()
    return {"message": "Atribuição removida"}

@router.patch("/{property_id}/status")
def change_property_status(
    property_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access)
):
    valid_statuses = ["active", "archived", "pending"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status inválido")

    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    prop.status = status
    db.commit()
    db.refresh(prop)
    return prop

@router.get("/{property_id}/availability", response_model=List[AvailabilityResponse])
def get_property_availability(property_id: int, db: Session = Depends(get_db)):
    return db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).all()

@router.post("/{property_id}/availability", response_model=List[AvailabilityResponse])
def update_property_availability(
    property_id: int, 
    availability_in: List[AvailabilityCreate], 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Validação de acesso (somente dono ou broker atribuído)
    if prop.owner_id != current_user.id and current_user.role != 'agency':
         # Checar se é broker atribuído
         is_assigned = any(b.id == current_user.id for b in prop.assigned_brokers)
         if not is_assigned:
             raise HTTPException(status_code=403, detail="Acesso negado")

    # Limpa as existentes e adiciona as novas
    db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).delete()
    
    for item in availability_in:
        db_avail = PropertyAvailability(**item.model_dump(), property_id=property_id)
        db.add(db_avail)
    
    db.commit()
    return db.query(PropertyAvailability).filter(PropertyAvailability.property_id == property_id).all()
