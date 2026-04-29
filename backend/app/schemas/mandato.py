from pydantic import BaseModel, ConfigDict
from datetime import datetime


class MandatoCriar(BaseModel):
    imovel_id: int
    proprietario_id: int
    tipo: str  # venda, locacao
    percentual_comissao: float
    exclusivo: bool = False
    data_vencimento: datetime | None = None


class MandatoResposta(MandatoCriar):
    id: int
    corretor_id: int
    situacao: str
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
