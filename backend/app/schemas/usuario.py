from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from uuid import UUID


class UsuarioCriar(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    nome: str = Field(..., min_length=2, max_length=120)
    perfil: str = Field("comprador", pattern="^(comprador|corretor|imobiliaria|admin)$")


class UsuarioResposta(BaseModel):
    id: int | str | UUID
    email: str
    nome: str | None = None
    perfil: str
    tipo_plano: str | None = None
    plano_expira_em: datetime | None = None
    telefone: str | None = None
    creci: str | None = None
    imobiliaria_id: int | str | UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class UserAdminResponse(BaseModel):
    id: int | str | UUID
    email: str
    nome: str | None = None
    perfil: str
    tipo_plano: str | None = None
    plano_expira_em: datetime | None = None
    creci: str | None = None
    ativo: bool
    criado_em: datetime
    broker_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class UserAdminUpdate(BaseModel):
    nome: str | None = None
    perfil: str | None = None
    tipo_plano: str | None = None
    plano_expira_em: datetime | None = None
    creci: str | None = None
    ativo: bool | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class BrokerCreate(BaseModel):
    nome: str
    email: EmailStr
    password: str
    telefone: str | None = None
    creci: str | None = None
