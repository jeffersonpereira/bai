from pydantic import BaseModel, ConfigDict
from datetime import datetime, time
from typing import List


class PropertyMediaBase(BaseModel):
    url: str
    media_type: str  # 'image', 'video', 'document'

    model_config = ConfigDict(from_attributes=True)


class AvailabilityCreate(BaseModel):
    day_of_week: int  # 0-6
    start_time: time
    end_time: time


class AvailabilityResponse(AvailabilityCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    role: str | None = None
    phone: str | None = None
    creci: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PropertyOwnerBase(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PropertyCreate(BaseModel):
    title: str
    description: str | None = None
    price: float
    valor_aluguel: float | None = None
    area: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    garage_spaces: int | None = 0
    financing_eligible: bool | None = False
    city: str | None = None
    neighborhood: str | None = None
    state: str | None = None
    full_address: str | None = None
    source_url: str | None = None
    image_url: str | None = None
    source: str | None = None
    listing_type: str | None = "venda"
    property_type: str | None = "apartamento"
    status: str | None = "active"
    actual_owner_id: int | None = None
    commission_percentage: float | None = None
    atributos_extras: dict | None = None
    media: List[PropertyMediaBase] = []
    availability_windows: List[AvailabilityCreate] = []


class PropertyResponse(PropertyCreate):
    id: int
    owner_id: int | None = None
    owner: UserBase | None = None
    actual_owner: PropertyOwnerBase | None = None
    created_at: datetime | None = None
    last_analysis_at: datetime | None = None
    is_star: bool | None = False
    valor_aluguel: float | None = None
    atributos_extras: dict | None = None
    market_score: float | None = 0.0
    media: List[PropertyMediaBase] = []
    availability_windows: List[AvailabilityResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedPropertiesResponse(BaseModel):
    items: List[PropertyResponse]
    total: int
    page: int
    limit: int
