from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class DocumentoCriar(BaseModel):
    titulo:          str
    tipo_documento:  str
    descricao:       Optional[str] = None
    nome_arquivo:    Optional[str] = None
    url_arquivo:     Optional[str] = None
    tamanho_bytes:   Optional[int] = None
    situacao:        str            = "rascunho"
    imovel_id:       Optional[int] = None
    proposta_id:     Optional[int] = None
    observacoes:     Optional[str] = None


class DocumentoAtualizar(BaseModel):
    titulo:          Optional[str] = None
    tipo_documento:  Optional[str] = None
    descricao:       Optional[str] = None
    nome_arquivo:    Optional[str] = None
    url_arquivo:     Optional[str] = None
    tamanho_bytes:   Optional[int] = None
    situacao:        Optional[str] = None
    observacoes:     Optional[str] = None


class UploaderSummary(BaseModel):
    id:   int
    nome: str

    model_config = ConfigDict(from_attributes=True)


class PropertySummary(BaseModel):
    id:     int
    titulo: str

    model_config = ConfigDict(from_attributes=True)


class ProposalSummary(BaseModel):
    id:             int
    valor_ofertado: float
    situacao:       str

    model_config = ConfigDict(from_attributes=True)


class DocumentoResposta(BaseModel):
    id:             int
    titulo:         str
    tipo_documento: str
    descricao:      Optional[str]
    nome_arquivo:   Optional[str]
    url_arquivo:    Optional[str]
    tamanho_bytes:  Optional[int]
    situacao:       str
    enviado_por:    int
    imovel_id:      Optional[int]
    proposta_id:    Optional[int]
    observacoes:    Optional[str]
    criado_em:      datetime
    atualizado_em:  datetime
    remetente:      Optional[UploaderSummary]
    imovel:         Optional[PropertySummary]
    proposta:       Optional[ProposalSummary]

    model_config = ConfigDict(from_attributes=True)


class PaginatedDocuments(BaseModel):
    items: List[DocumentoResposta]
    total: int
    page:  int
    limit: int
