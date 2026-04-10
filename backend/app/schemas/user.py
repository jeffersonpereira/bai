from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from uuid import UUID

_ALLOWED_REGISTER_ROLES = {"user", "broker", "agency"}


class UserCreate(BaseModel):
    """Schema público de registro."""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    name: str = Field(..., min_length=2, max_length=120)
    role: str = Field("user", pattern="^(user|broker|agency)$")


class UserResponse(BaseModel):
    id: int | str | UUID
    email: str
    name: str | None = None
    role: str
    plan_type: str | None = None
    plan_expires_at: datetime | None = None
    phone: str | None = None
    creci: str | None = None
    parent_id: int | str | UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class UserAdminResponse(BaseModel):
    id: int | str | UUID
    email: str
    name: str | None = None
    role: str
    plan_type: str | None = None
    plan_expires_at: datetime | None = None
    creci: str | None = None
    is_active: bool
    created_at: datetime
    broker_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class UserAdminUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    plan_type: str | None = None
    creci: str | None = None
    is_active: bool | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class BrokerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    creci: str | None = None
