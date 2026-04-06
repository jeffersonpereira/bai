from pydantic import BaseModel, ConfigDict
from typing import List


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

    model_config = ConfigDict(from_attributes=True)


class UserMatchResponse(BaseModel):
    user_id: int
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    match_score: int
    profile: BuyerProfileResponse

    model_config = ConfigDict(from_attributes=True)


class PropertyMatchSummary(BaseModel):
    """Summary of a property used inside scored match results."""
    id: int
    title: str
    price: float
    city: str | None = None
    neighborhood: str | None = None
    property_type: str | None = None
    listing_type: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    garage_spaces: int | None = None
    area: float | None = None
    image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ScoredPropertyMatch(BaseModel):
    """A property with its match score and breakdown against a buyer profile."""
    property: PropertyMatchSummary
    score: int                         # 0–100 percentage
    matched_criteria: List[str]        # e.g. ["Preço", "Bairro", "Quartos"]
    unmatched_criteria: List[str]      # e.g. ["Garagem", "Banheiros"]
