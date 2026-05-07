from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import List


class LeadBase(BaseModel):
    imovel_id: int
    nome: str
    email: EmailStr | None = None
    telefone: str | None = None
    origem: str | None = "site"
    situacao: str | None = "novo"
    observacoes: str | None = None


class LeadCriar(LeadBase):
    pass


class LeadResposta(LeadBase):
    id: int
    corretor_id: int | None = None
    criado_em: datetime
    broker_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedLeads(BaseModel):
    items: List[LeadResposta]
    total: int
    page: int
    limit: int


class ActivityBase(BaseModel):
    tipo_atividade: str
    descricao: str


class ActivityCreate(ActivityBase):
    pass


class ActivityResponse(ActivityBase):
    id: int
    usuario_id: int
    criado_em: datetime
    user_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
