from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, time
from typing import List


class PropertyMediaBase(BaseModel):
    url: str
    tipo_midia: str  # imagem, video, tour_virtual

    model_config = ConfigDict(from_attributes=True)


class AvailabilityCreate(BaseModel):
    dia_semana: int  # 0=Segunda … 6=Domingo
    hora_inicio: time
    hora_fim: time


class AvailabilityResponse(AvailabilityCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    id: int
    nome: str | None = None
    email: str | None = None
    perfil: str | None = None
    telefone: str | None = None
    creci: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PropertyOwnerBase(BaseModel):
    id: int
    nome: str
    email: str | None = None
    telefone: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PriceAnalysisRequest(BaseModel):
    price: float = Field(..., gt=0, le=999_999_999)
    area: float | None = Field(None, gt=0, le=999_999)
    city: str | None = Field(None, max_length=100)
    neighborhood: str | None = Field(None, max_length=200)
    bedrooms: int | None = Field(None, ge=0, le=20)
    listing_type: str | None = Field(None, max_length=50)
    atributos_extras: dict | None = None


class ImovelCriar(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=300)
    descricao: str | None = None
    preco: float = Field(..., gt=0, description="Preço deve ser positivo")
    valor_aluguel: float | None = Field(None, gt=0)
    area: float | None = Field(None, gt=0)
    quartos: int | None = Field(None, ge=0, le=50)
    banheiros: int | None = Field(None, ge=0, le=50)
    vagas: int | None = Field(0, ge=0, le=100)
    aceita_financiamento: bool | None = False
    cidade: str | None = None
    bairro: str | None = None
    estado: str | None = Field(None, max_length=2)
    endereco_completo: str | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    url_origem: str | None = None
    url_imagem: str | None = None
    origem: str | None = None
    tipo_oferta: str | None = Field("venda", pattern="^(venda|aluguel|ambos|temporada)$")
    tipo_imovel: str | None = Field("apartamento", pattern="^(apartamento|casa|terreno|comercial|rural)$")
    situacao: str | None = Field("ativo", pattern="^(ativo|arquivado|pendente|vendido|alugado)$")
    proprietario_id: int | None = None
    percentual_comissao: float | None = Field(None, ge=0, le=100)
    atributos_extras: dict | None = None
    midias: List[PropertyMediaBase] = []
    janelas_disponibilidade: List[AvailabilityCreate] = []


class ImovelResposta(ImovelCriar):
    id: int
    corretor_id: int | None = None
    corretor: UserBase | None = None
    proprietario: PropertyOwnerBase | None = None
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    ultima_analise_em: datetime | None = None
    destaque: bool | None = False
    pontuacao_mercado: float | None = 0.0
    total_visualizacoes: int | None = 0
    midias: List[PropertyMediaBase] = []
    janelas_disponibilidade: List[AvailabilityResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedPropertiesResponse(BaseModel):
    items: List[ImovelResposta]
    total: int
    page: int
    limit: int


class PropertyMapItem(BaseModel):
    id: int
    lat: float | None = None
    lng: float | None = None
    price: float
    type: str | None = None
    thumbnail_url: str | None = None
    slug: str | None = None
