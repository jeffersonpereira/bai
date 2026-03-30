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
):
    return property_service.get_properties(
        db=db, page=page, limit=limit, city=city, neighborhood=neighborhood,
        min_price=min_price, max_price=max_price, min_area=min_area, max_area=max_area,
        bedrooms=bedrooms, bathrooms=bathrooms, garage_spaces=garage_spaces,
        financing_eligible=financing_eligible, source=source, listing_type=listing_type,
        property_type=property_type, is_star=is_star,
    )


@router.get("/user/me", response_model=List[PropertyResponse])
def get_my_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_service.get_my_properties(db, current_user)


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    return property_service.get_property(db, property_id)


@router.post("/", response_model=PropertyResponse)
def create_property(
    property_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return property_service.create_property(db, property_in, current_user)


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    property_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
):
    return property_service.update_property(db, property_id, property_in, current_user)


@router.patch("/{property_id}/status", response_model=PropertyResponse)
def change_property_status(
    property_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_full_access),
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


@router.delete("/{property_id}/assign/{user_id}")
def unassign_broker(
    property_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_agency),
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


@router.post("/scrape", dependencies=[Depends(get_current_admin)])
async def trigger_scraping(background_tasks: BackgroundTasks):
    """Dispara job de scraping em background. Requer autenticação de admin."""

    from app.scraper.core import ImovelScraper
    from app.db.database import SessionLocal
    from app.models.property import Property
    from app.agents.scout import ScoutAgent
    import asyncio

    URLS_CONFIG = [
        {"url": "https://www.imovelweb.com.br/apartamentos-venda-sao-paulo-sp.html", "source": "imovelweb"},
        {"url": "https://www.imovelweb.com.br/casas-venda-sao-paulo-sp.html", "source": "imovelweb"},
        {"url": "https://www.olx.com.br/imoveis/venda/estado-sp/sao-paulo-e-regiao", "source": "olx"},
        {"url": "https://www.olx.com.br/imoveis/venda/estado-rj/rio-de-janeiro-e-regiao", "source": "olx"},
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
                        exists = db.query(Property).filter(Property.source_url == item["source_url"]).first()
                        if not exists and item["source_url"]:
                            db.add(Property(**item))
                    db.commit()
            
            # Executar análise do Agente Scout
            scout = ScoutAgent()
            scout.analyze_and_update(db)
            
            await asyncio.sleep(3)
        except Exception as e:
            db.rollback()
            print(f"Erro no job de scraping: {e}")
        finally:
            db.close()

    background_tasks.add_task(bg_scrape)
    return {"message": "Job de scraping iniciado em segundo plano"}
