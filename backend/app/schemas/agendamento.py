from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AgendamentoCriar(BaseModel):
    imovel_id: int
    nome_visitante: str
    telefone_visitante: str
    data_visita: datetime
    data_fim_visita: datetime | None = None
    observacoes: str | None = None


class ImovelResumoAgendamento(BaseModel):
    id: int
    titulo: str
    bairro: str | None = None
    cidade: str | None = None
    url_imagem: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AgendamentoResposta(BaseModel):
    id: int
    imovel_id: int
    corretor_id: int | None = None
    comprador_id: int | None = None
    nome_visitante: str
    telefone_visitante: str
    data_visita: datetime
    data_fim_visita: datetime | None = None
    situacao: str
    observacoes: str | None = None
    criado_em: datetime
    feedback_visita: str | None = None
    imovel: ImovelResumoAgendamento | None = None

    model_config = ConfigDict(from_attributes=True)
