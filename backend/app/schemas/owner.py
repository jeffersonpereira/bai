from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import List


class OwnerBase(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    document: str | None = None
    address: str | None = None
    notes: str | None = None


class OwnerCreate(OwnerBase):
    pass


class OwnerResponse(OwnerBase):
    id: int
    created_at: datetime
    broker_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedOwners(BaseModel):
    items: List[OwnerResponse]
    total: int
    page: int
    limit: int
