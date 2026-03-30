from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime


class UserCreate(BaseModel):
    """Schema público de registro."""
    email: EmailStr
    password: str
    name: str | None = None
    role: str | None = "user"  # Opcional, padrão "user"


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    role: str
    phone: str | None = None
    creci: str | None = None
    parent_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class UserAdminResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    role: str
    creci: str | None = None
    is_active: bool
    created_at: datetime
    broker_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class UserAdminUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
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
