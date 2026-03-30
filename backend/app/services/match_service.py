from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.property import Property
from app.models.buyer_profile import BuyerProfile
from app.models.user import User
from app.schemas.match import (
    BuyerProfileBase, BuyerProfileResponse, UserMatchResponse,
    ScoredPropertyMatch, PropertyMatchSummary,
)


def get_profiles(db: Session, user_id: int) -> list:
    return db.query(BuyerProfile).filter(BuyerProfile.user_id == user_id).all()


def get_profile(db: Session, profile_id: int, user_id: int) -> BuyerProfile:
    profile = db.query(BuyerProfile).filter(
        BuyerProfile.id == profile_id,
        BuyerProfile.user_id == user_id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return profile


def create_profile(db: Session, profile_in: BuyerProfileBase, user_id: int) -> BuyerProfile:
    profile = BuyerProfile(**profile_in.model_dump(), user_id=user_id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, profile_id: int, profile_in: BuyerProfileBase, user_id: int) -> BuyerProfile:
    profile = get_profile(db, profile_id, user_id)
    for key, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def delete_profile(db: Session, profile_id: int, user_id: int) -> dict:
    profile = get_profile(db, profile_id, user_id)
    db.delete(profile)
    db.commit()
    return {"message": "Perfil deletado com sucesso"}


def _build_properties_query(db: Session, profile: BuyerProfile, expanded: bool = False):
    query = db.query(Property).filter(Property.status == "active")

    if profile.listing_type:
        query = query.filter(Property.listing_type == profile.listing_type)
    if profile.property_type:
        query = query.filter(Property.property_type.ilike(f"%{profile.property_type}%"))
    if profile.city:
        query = query.filter(Property.city.ilike(f"%{profile.city}%"))

    if not expanded:
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
        if profile.min_price:
            query = query.filter(Property.price >= profile.min_price * 0.8)
        if profile.max_price:
            query = query.filter(Property.price <= profile.max_price * 1.20)
        if profile.min_bedrooms and profile.min_bedrooms > 1:
            query = query.filter(Property.bedrooms >= profile.min_bedrooms - 1)

    return query


def get_matching_properties(db: Session, profile_id: int, user_id: int, expanded: bool = False) -> list:
    profile = get_profile(db, profile_id, user_id)
    return _build_properties_query(db, profile, expanded=expanded).limit(50).all()


def _score_property(profile: BuyerProfile, prop: Property) -> tuple[int, list[str], list[str]]:
    """Returns (score 0-100, matched_criteria, unmatched_criteria)."""
    matched: list[str] = []
    unmatched: list[str] = []

    def check(label: str, condition: bool | None) -> None:
        if condition is None:
            return  # criterion not set — skip entirely
        (matched if condition else unmatched).append(label)

    # Price range
    if profile.min_price or profile.max_price:
        in_range = (
            (not profile.min_price or prop.price >= profile.min_price)
            and (not profile.max_price or prop.price <= profile.max_price)
        )
        check("Preço", in_range)

    # City
    if profile.city:
        check("Cidade", profile.city.lower() in (prop.city or "").lower())

    # Neighborhood
    if profile.neighborhood:
        terms = [t.strip().lower() for t in profile.neighborhood.split(",") if t.strip()]
        prop_nb = (prop.neighborhood or "").lower()
        check("Bairro", any(t in prop_nb for t in terms))

    # Property type
    if profile.property_type:
        check("Tipo", profile.property_type.lower() in (prop.property_type or "").lower())

    # Listing type
    if profile.listing_type:
        check("Modalidade", profile.listing_type == prop.listing_type)

    # Bedrooms
    if profile.min_bedrooms is not None:
        check("Quartos", prop.bedrooms is not None and prop.bedrooms >= profile.min_bedrooms)

    # Bathrooms
    if profile.min_bathrooms is not None:
        check("Banheiros", prop.bathrooms is not None and prop.bathrooms >= profile.min_bathrooms)

    # Garage
    if profile.min_garage_spaces is not None:
        check("Garagem", prop.garage_spaces is not None and prop.garage_spaces >= profile.min_garage_spaces)

    total = len(matched) + len(unmatched)
    score = 100 if total == 0 else int((len(matched) / total) * 100)
    return score, matched, unmatched


def get_scored_matching_properties(
    db: Session,
    profile_id: int,
    user_id: int,
    min_score: int = 40,
    limit: int = 50,
) -> list[ScoredPropertyMatch]:
    """Returns properties scored against the buyer profile, sorted by score desc."""
    profile = get_profile(db, profile_id, user_id)
    # Use expanded query to cast a wider net, then filter by score
    properties = _build_properties_query(db, profile, expanded=True).limit(200).all()

    results: list[ScoredPropertyMatch] = []
    for prop in properties:
        score, matched, unmatched = _score_property(profile, prop)
        if score >= min_score:
            results.append(
                ScoredPropertyMatch(
                    property=PropertyMatchSummary.model_validate(prop),
                    score=score,
                    matched_criteria=matched,
                    unmatched_criteria=unmatched,
                )
            )

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:limit]


def get_matching_buyers(db: Session, property_id: int, current_user: User) -> list[UserMatchResponse]:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    if current_user.role not in ["agency", "broker", "admin"] and prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso")

    query = db.query(BuyerProfile, User).join(User, BuyerProfile.user_id == User.id)

    if prop.listing_type:
        query = query.filter(
            or_(BuyerProfile.listing_type.is_(None), BuyerProfile.listing_type == prop.listing_type)
        )
    query = query.filter(
        or_(BuyerProfile.max_price.is_(None), BuyerProfile.max_price >= prop.price * 0.9),
        or_(BuyerProfile.min_price.is_(None), BuyerProfile.min_price <= prop.price * 1.1),
    )
    if prop.city:
        query = query.filter(
            or_(BuyerProfile.city.is_(None), BuyerProfile.city.ilike(f"%{prop.city}%"))
        )

    prop_city = (prop.city or "").lower()
    prop_neighborhood = (prop.neighborhood or "").lower()

    results = []
    for bp, user in query.all():
        score = 0
        total_criteria = 0

        if bp.min_price or bp.max_price:
            total_criteria += 2
            in_range = (not bp.min_price or prop.price >= bp.min_price) and (
                not bp.max_price or prop.price <= bp.max_price
            )
            near_range = (not bp.min_price or prop.price >= bp.min_price * 0.9) and (
                not bp.max_price or prop.price <= bp.max_price * 1.1
            )
            if in_range:
                score += 2
            elif near_range:
                score += 1

        if bp.city:
            total_criteria += 1
            if bp.city.lower() in prop_city:
                score += 1

        if bp.neighborhood:
            total_criteria += 1
            terms = [t.strip().lower() for t in bp.neighborhood.split(",") if t.strip()]
            if any(t in prop_neighborhood for t in terms):
                score += 1

        if bp.min_bedrooms is not None and prop.bedrooms is not None:
            total_criteria += 1
            if prop.bedrooms >= bp.min_bedrooms:
                score += 1

        match_percentage = 100 if total_criteria == 0 else int((score / total_criteria) * 100)

        if match_percentage >= 40:
            results.append(
                UserMatchResponse(
                    user_id=user.id,
                    name=user.name,
                    email=user.email,
                    phone=user.phone,
                    match_score=match_percentage,
                    profile=BuyerProfileResponse.model_validate(bp),
                )
            )

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:100]
