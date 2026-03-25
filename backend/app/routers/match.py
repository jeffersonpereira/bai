from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from ..db.database import get_db
from ..models.property import Property
from ..models.buyer_profile import BuyerProfile
from .auth import get_current_user
from ..models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/match", tags=["matchmaking"])

class BuyerProfileBase(BaseModel):
    name: str = "Meu Perfil"
    min_price: float | None = None
    max_price: float | None = None
    city: str | None = None
    neighborhood: str | None = None
    property_type: str | None = None
    listing_type: str | None = "venda"
    min_bedrooms: int | None = None
    min_bathrooms: int | None = None
    min_garage_spaces: int | None = None
    financing_approved: bool | None = False

class BuyerProfileResponse(BuyerProfileBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

from .properties import PropertyResponse

@router.get("/profiles", response_model=List[BuyerProfileResponse])
def get_my_profiles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profiles = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).all()
    return profiles

@router.get("/profiles/{profile_id}", response_model=BuyerProfileResponse)
def get_profile(profile_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(BuyerProfile).filter(BuyerProfile.id == profile_id, BuyerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return profile

@router.post("/profiles", response_model=BuyerProfileResponse)
def create_profile(profile_in: BuyerProfileBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = BuyerProfile(**profile_in.model_dump(), user_id=current_user.id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.put("/profiles/{profile_id}", response_model=BuyerProfileResponse)
def update_profile(profile_id: int, profile_in: BuyerProfileBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(BuyerProfile).filter(BuyerProfile.id == profile_id, BuyerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    for key, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(BuyerProfile).filter(BuyerProfile.id == profile_id, BuyerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    db.delete(profile)
    db.commit()
    return {"message": "Perfil deletado com sucesso"}

def _build_properties_query(db: Session, profile: BuyerProfile, expanded: bool = False):
    query = db.query(Property).filter(Property.status == "active")
    
    # Logica exata
    if profile.listing_type:
        query = query.filter(Property.listing_type == profile.listing_type)
        
    if profile.property_type:
        query = query.filter(Property.property_type.ilike(f"%{profile.property_type}%"))
        
    if profile.city:
        query = query.filter(Property.city.ilike(f"%{profile.city}%"))

    if not expanded:
        # Match Perfeito
        if profile.min_price:
            query = query.filter(Property.price >= profile.min_price)
        if profile.max_price:
            query = query.filter(Property.price <= profile.max_price)
        if profile.neighborhood:
            terms = [t.strip() for t in profile.neighborhood.split(",") if t.strip()]
            if terms:
                query = query.filter(or_(*[Property.neighborhood.ilike(f"%{t}%") for t in terms]))
        if profile.min_bedrooms:
            query = query.filter(Property.bedrooms >= profile.min_bedrooms)
        if profile.min_bathrooms:
            query = query.filter(Property.bathrooms >= profile.min_bathrooms)
        if profile.min_garage_spaces:
            query = query.filter(Property.garage_spaces >= profile.min_garage_spaces)
    else:
        # Busca Expandida: Inflaciona teto em 20%, ignora bairro pontual, aceita 1 quarto a menos
        if profile.min_price:
            query = query.filter(Property.price >= (profile.min_price * 0.8)) # 20% mais barato
        if profile.max_price:
            query = query.filter(Property.price <= (profile.max_price * 1.20)) # 20% mais caro
        if profile.min_bedrooms and profile.min_bedrooms > 1:
            query = query.filter(Property.bedrooms >= (profile.min_bedrooms - 1))
        # Neighborhood e banheiros ignorados para trazer volume heurístico

    return query

@router.get("/properties/{profile_id}", response_model=List[PropertyResponse])
def get_matching_properties(profile_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(BuyerProfile).filter(BuyerProfile.id == profile_id, BuyerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de busca não encontrado")
    
    query = _build_properties_query(db, profile, expanded=False)
    return query.limit(50).all()

@router.get("/properties/{profile_id}/expanded", response_model=List[PropertyResponse])
def get_expanded_properties(profile_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(BuyerProfile).filter(BuyerProfile.id == profile_id, BuyerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de busca não encontrado")
    
    query = _build_properties_query(db, profile, expanded=True)
    return query.limit(50).all()

class UserMatchResponse(BaseModel):
    user_id: int
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    match_score: int
    profile: BuyerProfileResponse
    class Config:
        from_attributes = True

@router.get("/buyers/{property_id}", response_model=List[UserMatchResponse])
def get_matching_buyers(property_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Verificação de permissão simplificada
    if current_user.role not in ["agency", "broker", "admin"] and prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso")

    # Otimização: Filtrar via SQL o que for possível para não carregar milhares de perfis irrelevantes
    # 1. Deve ser o mesmo tipo de anúncio (venda/aluguel)
    # 2. Se o perfil exige uma cidade, deve bater com a city do imóvel
    # 3. Preço do imóvel deve estar dentro do range (se definido no perfil)
    
    query = db.query(BuyerProfile, User).join(User, BuyerProfile.user_id == User.id)
    
    # Filtro básico de listing_type
    if prop.listing_type:
        query = query.filter(or_(BuyerProfile.listing_type == None, BuyerProfile.listing_type == prop.listing_type))
    
    # Filtro de preço (com margem de 10% para não ser rígido demais no SQL)
    query = query.filter(
        or_(BuyerProfile.max_price == None, BuyerProfile.max_price >= (prop.price * 0.9)),
        or_(BuyerProfile.min_price == None, BuyerProfile.min_price <= (prop.price * 1.1))
    )

    # Filtro de Cidade (se o perfil especificou uma)
    if prop.city:
        query = query.filter(or_(BuyerProfile.city == None, BuyerProfile.city.ilike(f"%{prop.city}%")))

    buyers_with_users = query.all()
    results = []
    
    prop_city = (prop.city or "").lower()
    prop_neighborhood = (prop.neighborhood or "").lower()
    
    for bp, user in buyers_with_users:
        score = 0
        total_criteria = 0
        
        # Preço (Peso 2)
        if bp.min_price or bp.max_price:
            total_criteria += 2
            if (not bp.min_price or prop.price >= bp.min_price) and (not bp.max_price or prop.price <= bp.max_price):
                score += 2
            elif (not bp.min_price or prop.price >= (bp.min_price * 0.9)) and (not bp.max_price or prop.price <= (bp.max_price * 1.1)):
                score += 1 # Perto da faixa ganha metade dos pontos
                
        # Cidade (Peso 1)
        if bp.city:
            total_criteria += 1
            if bp.city.lower() in prop_city:
                score += 1
                
        # Bairro (Peso 1)
        if bp.neighborhood:
            total_criteria += 1
            terms = [t.strip().lower() for t in bp.neighborhood.split(",") if t.strip()]
            if any(t in prop_neighborhood for t in terms):
                score += 1
                
        # Quartos (Peso 1)
        if bp.min_bedrooms is not None and prop.bedrooms is not None:
            total_criteria += 1
            if prop.bedrooms >= bp.min_bedrooms:
                score += 1

        if total_criteria == 0:
            match_percentage = 100 # Sem critérios = match total
        else:
            match_percentage = int((score / total_criteria) * 100)
        
        if match_percentage >= 40: # Baixa um pouco o threshold para busca mais ampla
            results.append(UserMatchResponse(
                user_id=user.id,
                name=user.name,
                email=user.email,
                phone=user.phone,
                match_score=match_percentage,
                profile=BuyerProfileResponse.from_orm(bp)
            ))
    
    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:100] # Limite de 100 resultados para performance de rede
