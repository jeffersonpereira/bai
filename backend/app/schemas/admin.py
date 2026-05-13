from pydantic import BaseModel, EmailStr, Field
from typing import List, Literal
from app.schemas.usuario import PermissaoEnum


class AdminCriarUsuarioRequest(BaseModel):
    nome: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(..., min_length=6, max_length=72)
    perfil: Literal["comprador", "corretor", "imobiliaria", "admin"] = "comprador"
    permissoes: List[PermissaoEnum] = []
    tipo_plano: Literal["gratuito", "pro", "premium"] = "gratuito"


class AdminStats(BaseModel):
    total_users: int
    total_agencies: int
    total_brokers: int
    total_properties: int
    total_leads: int
    recent_registrations: int
    premium_users: int
