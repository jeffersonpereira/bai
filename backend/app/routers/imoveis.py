from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.imovel import (
    ImovelCriar, ImovelResposta, PaginatedPropertiesResponse,
    AvailabilityCreate, AvailabilityResponse, PropertyMapItem, PriceAnalysisRequest,
)
from app.services import imovel_service
from app.core.deps import get_current_user, get_current_agency, get_current_full_access, get_current_admin
from app.core.quota import verificar_quota_imoveis, verificar_quota_fotos

router = APIRouter(prefix="/imoveis", tags=["imoveis"], redirect_slashes=False)


@router.get("/locations")
def get_locations(db: Session = Depends(get_db)):
    return imovel_service.get_locations(db)


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
    return imovel_service.get_properties(
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
    titulo: str | None = Query(None),
    status: str | None = Query(None),
    current_user: Usuario = Depends(get_current_user),
):
    return imovel_service.get_my_properties(db, current_user, page=page, limit=limit, title=titulo, status=status)


@router.get("/user/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return imovel_service.get_property_stats(db, current_user)


@router.get("/proprietario/{proprietario_id}", response_model=PaginatedPropertiesResponse)
def get_properties_by_owner(
    proprietario_id: int,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Usuario = Depends(get_current_user),
):
    return imovel_service.get_properties_by_owner(db, proprietario_id, page=page, limit=limit)


@router.get("/map", response_model=List[PropertyMapItem])
def get_map_properties(
    bbox: str = Query(..., description="south,west,north,east (decimais)"),
    price_min: float | None = Query(None),
    price_max: float | None = Query(None),
    type: str | None = Query(None),
    bedrooms: int | None = Query(None),
    db: Session = Depends(get_db),
):
    parts = bbox.split(",")
    if len(parts) != 4:
        raise HTTPException(status_code=422, detail="bbox deve ter exatamente 4 valores: south,west,north,east")
    try:
        south, west, north, east = [float(p.strip()) for p in parts]
    except ValueError:
        raise HTTPException(status_code=422, detail="bbox deve conter valores numéricos")

    if not (-90 <= south <= 90 and -90 <= north <= 90):
        raise HTTPException(status_code=422, detail="Latitude deve estar entre -90 e 90")
    if not (-180 <= west <= 180 and -180 <= east <= 180):
        raise HTTPException(status_code=422, detail="Longitude deve estar entre -180 e 180")
    if south >= north:
        raise HTTPException(status_code=422, detail="south deve ser menor que north")

    return imovel_service.get_map_properties(
        db=db,
        south=south, west=west, north=north, east=east,
        price_min=price_min,
        price_max=price_max,
        property_type=type,
        bedrooms=bedrooms,
    )


@router.get("/{property_id}", response_model=ImovelResposta)
def get_property(property_id: int, db: Session = Depends(get_db)):
    return imovel_service.get_property(db, property_id)


@router.post("/{property_id}/view")
def record_property_view(property_id: int, db: Session = Depends(get_db)):
    views = imovel_service.increment_views_count(db, property_id)
    return {"views_count": views}


@router.post("/", response_model=ImovelResposta)
def create_property(
    property_in: ImovelCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_quota_imoveis(db, current_user)
    verificar_quota_fotos(current_user, len(property_in.midias))
    return imovel_service.create_property(db, property_in, current_user)


@router.put("/{property_id}", response_model=ImovelResposta)
def update_property(
    property_id: int,
    property_in: ImovelCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return imovel_service.update_property(db, property_id, property_in, current_user)


@router.delete("/{property_id}", status_code=204)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    imovel_service.delete_property(db, property_id, current_user)


@router.patch("/{property_id}/status", response_model=ImovelResposta)
def change_property_status(
    property_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return imovel_service.change_status(db, property_id, status, current_user)


@router.post("/{property_id}/assign")
def assign_broker(
    property_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_agency),
):
    return imovel_service.assign_broker(db, property_id, user_id, current_user)


@router.delete("/{property_id}/assign/{user_id}")
def unassign_broker(
    property_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_agency),
):
    return imovel_service.unassign_broker(db, property_id, user_id, current_user)


@router.get("/{property_id}/availability", response_model=List[AvailabilityResponse])
def get_property_availability(
    property_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return imovel_service.get_availability(db, property_id)


@router.post("/{property_id}/availability", response_model=List[AvailabilityResponse])
def update_property_availability(
    property_id: int,
    availability_in: List[AvailabilityCreate],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return imovel_service.update_availability(db, property_id, availability_in, current_user)


@router.post("/price-analysis")
def price_analysis(
    body: PriceAnalysisRequest,
    db: Session = Depends(get_db),
):
    return imovel_service.analyze_price(
        db, body.price, body.area, body.city, body.neighborhood,
        body.bedrooms, body.listing_type, body.atributos_extras
    )


@router.post("/{imovel_id}/imagens", status_code=201)
async def upload_imagem_imovel(
    imovel_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    prop = imovel_service.get_property(db, imovel_id)
    if prop.corretor_id != current_user.id and current_user.perfil not in ("imobiliaria", "admin"):
        raise HTTPException(status_code=403, detail="Sem permissão para adicionar imagens a este imóvel")
    midia = await imovel_service.fazer_upload_imagem(imovel_id, arquivo, db)
    return {"id": midia.id, "url": midia.url, "ordem": midia.ordem}


@router.delete("/{imovel_id}/imagens/{midia_id}", status_code=204)
def delete_imagem_imovel(
    imovel_id: int,
    midia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    prop = imovel_service.get_property(db, imovel_id)
    if prop.corretor_id != current_user.id and current_user.perfil not in ("imobiliaria", "admin"):
        raise HTTPException(status_code=403, detail="Sem permissão para remover imagens deste imóvel")
    imovel_service.deletar_imagem_imovel(midia_id, imovel_id, db)
