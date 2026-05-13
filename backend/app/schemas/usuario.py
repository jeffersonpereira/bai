from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Any, List, Literal
from enum import Enum


class PermissaoEnum(str, Enum):
    gerenciar_usuarios = "gerenciar_usuarios"
    gerenciar_imoveis = "gerenciar_imoveis"
    gerenciar_leads = "gerenciar_leads"
    gerenciar_planos = "gerenciar_planos"
    ver_relatorios = "ver_relatorios"
    gerenciar_cupons = "gerenciar_cupons"
    configuracoes_sistema = "configuracoes_sistema"


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
    imobiliaria_id: int | None = None
    permissoes: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class UserAdminUpdate(BaseModel):
    nome: str | None = None
    perfil: Literal["comprador", "corretor", "imobiliaria", "admin"] | None = None
    tipo_plano: str | None = None
    plano_expira_em: datetime | None = None
    creci: str | None = None
    ativo: bool | None = None
    imobiliaria_id: int | None = None
    permissoes: List[PermissaoEnum] | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class BrokerCreate(BaseModel):
    nome: str
    email: EmailStr
    password: str
    telefone: str | None = None
    creci: str | None = None


class RedesSociais(BaseModel):
    instagram: str | None = None
    facebook: str | None = None
    linkedin: str | None = None
    site: str | None = None
    whatsapp: str | None = None


class LandingConfigAtualizar(BaseModel):
    slug: str | None = Field(None, min_length=3, max_length=100, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$")
    bio: str | None = Field(None, max_length=1000)
    foto_perfil_url: str | None = Field(None, max_length=500)
    cor_primaria: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    cor_secundaria: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    redes_sociais: RedesSociais | None = None
    landing_ativa: bool | None = None


class LandingConfigResposta(BaseModel):
    slug: str | None = None
    bio: str | None = None
    foto_perfil_url: str | None = None
    cor_primaria: str | None = None
    cor_secundaria: str | None = None
    redes_sociais: Any | None = None
    landing_ativa: bool = False
    tipo_plano: str | None = None
    landing_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class LandingPerfilPublico(BaseModel):
    id: int
    nome: str | None = None
    perfil: str
    creci: str | None = None
    telefone: str | None = None
    bio: str | None = None
    foto_perfil_url: str | None = None
    cor_primaria: str = "#1d4ed8"
    cor_secundaria: str = "#1e293b"
    redes_sociais: Any | None = None
    tipo_plano: str | None = None

    model_config = ConfigDict(from_attributes=True)
