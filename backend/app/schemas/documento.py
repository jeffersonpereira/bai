from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class DocumentoCriar(BaseModel):
    titulo:               str
    tipo_documento:       str
    contexto:             str             = "operacional"
    descricao:            Optional[str]   = None
    nome_arquivo:         Optional[str]   = None
    url_arquivo:          Optional[str]   = None
    tamanho_bytes:        Optional[int]   = None
    hash_sha256:          Optional[str]   = None
    situacao:             str             = "rascunho"
    visibilidade:         str             = "interno"
    assinado_digitalmente: bool           = False
    validade_em:          Optional[datetime] = None
    tags:                 Optional[List[str]] = None
    imovel_id:            Optional[int]   = None
    proprietario_id:      Optional[int]   = None
    proposta_id:          Optional[int]   = None
    observacoes:          Optional[str]   = None


class DocumentoAtualizar(BaseModel):
    titulo:               Optional[str]   = None
    tipo_documento:       Optional[str]   = None
    contexto:             Optional[str]   = None
    descricao:            Optional[str]   = None
    nome_arquivo:         Optional[str]   = None
    url_arquivo:          Optional[str]   = None
    tamanho_bytes:        Optional[int]   = None
    hash_sha256:          Optional[str]   = None
    situacao:             Optional[str]   = None
    visibilidade:         Optional[str]   = None
    assinado_digitalmente: Optional[bool] = None
    validade_em:          Optional[datetime] = None
    tags:                 Optional[List[str]] = None
    observacoes:          Optional[str]   = None


class UploaderSummary(BaseModel):
    id:   int
    nome: str
    model_config = ConfigDict(from_attributes=True)


class PropertySummary(BaseModel):
    id:     int
    titulo: str
    model_config = ConfigDict(from_attributes=True)


class ProprietarioSummary(BaseModel):
    id:   int
    nome: str
    model_config = ConfigDict(from_attributes=True)


class ProposalSummary(BaseModel):
    id:             int
    valor_ofertado: float
    situacao:       str
    model_config = ConfigDict(from_attributes=True)


class DocumentoResposta(BaseModel):
    id:                   int
    titulo:               str
    tipo_documento:       str
    contexto:             str
    descricao:            Optional[str]
    nome_arquivo:         Optional[str]
    url_arquivo:          Optional[str]
    tamanho_bytes:        Optional[int]
    hash_sha256:          Optional[str]
    situacao:             str
    visibilidade:         str
    assinado_digitalmente: bool
    validade_em:          Optional[datetime]
    versao_numero:        int
    documento_origem_id:  Optional[int]
    tags:                 Optional[List[str]]
    observacoes:          Optional[str]
    enviado_por:          int
    imovel_id:            Optional[int]
    proprietario_id:      Optional[int]
    proposta_id:          Optional[int]
    criado_em:            datetime
    atualizado_em:        datetime
    remetente:            Optional[UploaderSummary]
    imovel:               Optional[PropertySummary]
    proprietario:         Optional[ProprietarioSummary]
    proposta:             Optional[ProposalSummary]
    total_versoes:        int = 1

    model_config = ConfigDict(from_attributes=True)


class PaginatedDocuments(BaseModel):
    items: List[DocumentoResposta]
    total: int
    page:  int
    limit: int


class DocumentosVencendo(BaseModel):
    items: List[DocumentoResposta]
    total: int
