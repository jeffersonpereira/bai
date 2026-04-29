from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import List


class OwnerBase(BaseModel):
    nome: str
    email: EmailStr | None = None
    telefone: str | None = None
    documento: str | None = None
    endereco: str | None = None
    observacoes: str | None = None


class ProprietarioCriar(OwnerBase):
    pass


class ProprietarioResposta(OwnerBase):
    id: int
    criado_em: datetime
    broker_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedOwners(BaseModel):
    items: List[ProprietarioResposta]
    total: int
    page: int
    limit: int
