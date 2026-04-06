from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import List


class ProposalCreate(BaseModel):
    property_id:          int
    buyer_name:           str
    buyer_email:          EmailStr | None = None
    buyer_phone:          str | None      = None
    proposed_price:       float
    payment_method:       str             = "financiamento"  # avista | financiamento | misto
    financing_percentage: float | None    = None
    conditions:           str | None      = None
    message:              str | None      = None


class ProposalStatusUpdate(BaseModel):
    status: str  # pendente | visualizada | encaminhada | aceita | recusada | contraproposta


class PropertySummary(BaseModel):
    id:           int
    title:        str
    price:        float
    city:         str | None = None
    neighborhood: str | None = None
    image_url:    str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProposalResponse(BaseModel):
    id:                   int
    property_id:          int
    buyer_user_id:        int | None    = None
    buyer_name:           str
    buyer_email:          str | None    = None
    buyer_phone:          str | None    = None
    proposed_price:       float
    payment_method:       str
    financing_percentage: float | None  = None
    conditions:           str | None    = None
    message:              str | None    = None
    status:               str
    broker_id:            int | None    = None
    created_at:           datetime
    property:             PropertySummary | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedProposals(BaseModel):
    items: List[ProposalResponse]
    total: int
    page:  int
    limit: int
