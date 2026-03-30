from pydantic import BaseModel, ConfigDict
from datetime import datetime


class MandateCreate(BaseModel):
    property_id: int
    owner_id: int
    type: str  # venda, locacao
    commission_percentage: float
    is_exclusive: bool = False
    expiry_date: datetime | None = None


class MandateResponse(MandateCreate):
    id: int
    broker_id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
