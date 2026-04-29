from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import List


class PropostaCriar(BaseModel):
    imovel_id:               int
    nome_comprador:          str
    email_comprador:         EmailStr | None = None
    telefone_comprador:      str | None      = None
    valor_ofertado:          float
    forma_pagamento:         str             = "financiamento"  # avista | financiamento | misto
    percentual_financiamento: float | None   = None
    condicoes:               str | None      = None
    mensagem:                str | None      = None


class ProposalStatusUpdate(BaseModel):
    situacao: str  # pendente | visualizada | encaminhada | aceita | recusada | contraproposta


class PropertySummary(BaseModel):
    id:           int
    titulo:       str
    preco:        float
    cidade:       str | None = None
    bairro:       str | None = None
    url_imagem:   str | None = None

    model_config = ConfigDict(from_attributes=True)


class PropostaResposta(BaseModel):
    id:                      int
    imovel_id:               int
    comprador_id:            int | None    = None
    nome_comprador:          str
    email_comprador:         str | None    = None
    telefone_comprador:      str | None    = None
    valor_ofertado:          float
    forma_pagamento:         str
    percentual_financiamento: float | None = None
    condicoes:               str | None    = None
    mensagem:                str | None    = None
    situacao:                str
    corretor_id:             int | None    = None
    criado_em:               datetime
    imovel:                  PropertySummary | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedProposals(BaseModel):
    items: List[PropostaResposta]
    total: int
    page:  int
    limit: int
