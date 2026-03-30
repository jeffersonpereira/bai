from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import List


class LeadBase(BaseModel):
    property_id: int
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = "site"
    status: str | None = "novo"
    notes: str | None = None


class LeadCreate(LeadBase):
    pass


class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    broker_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedLeads(BaseModel):
    items: List[LeadResponse]
    total: int
    page: int
    limit: int


class ActivityBase(BaseModel):
    activity_type: str
    description: str


class ActivityCreate(ActivityBase):
    pass


class ActivityResponse(ActivityBase):
    id: int
    user_id: int
    created_at: datetime
    user_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
