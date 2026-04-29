from pydantic import BaseModel


class ComissaoCreate(BaseModel):
    imovel_id: int
    corretor_id: int
    percentual: float
    proposta_id: int | None = None
    observacoes: str | None = None


class ComissaoStatusUpdate(BaseModel):
    situacao: str  # pendente | pago | cancelado
