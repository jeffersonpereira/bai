from pydantic import BaseModel, ConfigDict
from typing import List


class BuyerProfileBase(BaseModel):
    nome_perfil: str = "Meu Perfil"
    preco_minimo: float | None = None
    preco_maximo: float | None = None
    cidade: str | None = None
    bairro: str | None = None
    tipo_imovel: str | None = None
    tipo_oferta: str | None = "venda"
    quartos_minimo: int | None = None
    banheiros_minimo: int | None = None
    vagas_minimo: int | None = None
    financiamento_aprovado: bool | None = False


class BuyerProfileResponse(BuyerProfileBase):
    id: int
    usuario_id: int

    model_config = ConfigDict(from_attributes=True)


class UserMatchResponse(BaseModel):
    usuario_id: int
    nome: str | None = None
    email: str | None = None
    telefone: str | None = None
    match_score: int
    profile: BuyerProfileResponse

    model_config = ConfigDict(from_attributes=True)


class PropertyMatchSummary(BaseModel):
    id: int
    titulo: str
    preco: float
    cidade: str | None = None
    bairro: str | None = None
    tipo_imovel: str | None = None
    tipo_oferta: str | None = None
    quartos: int | None = None
    banheiros: int | None = None
    vagas: int | None = None
    area: float | None = None
    url_imagem: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ScoredPropertyMatch(BaseModel):
    property: PropertyMatchSummary
    score: int
    matched_criteria: List[str]
    unmatched_criteria: List[str]
