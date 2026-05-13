from pydantic import BaseModel, Field
from typing import Optional


class LimitesPlano(BaseModel):
    imoveis_ativos: Optional[int]
    fotos_por_imovel: Optional[int]
    storage_bytes: int
    leads_ativos: Optional[int]
    documentos: Optional[int]
    assinatura_digital: bool
    whatsapp: bool
    landing_page: bool
    corretores_equipe: int
    relatorios: bool
    matching: bool


class ConsumoAtual(BaseModel):
    imoveis_ativos: int
    leads_ativos: int
    documentos: int
    storage_bytes_documentos: int


class ConsumoResponse(BaseModel):
    tipo_plano: str
    plano_expira_em: Optional[str]
    limites: LimitesPlano
    consumo: ConsumoAtual


class PlanoInfo(BaseModel):
    chave: str
    nome: str
    preco_mensal: float
    preco_anual: float
    limites: LimitesPlano


# ---------------------------------------------------------------------------
# Checkout
# ---------------------------------------------------------------------------

class CheckoutRequest(BaseModel):
    plano: str = Field(..., pattern="^(pro|premium)$")
    ciclo: str = Field(..., pattern="^(mensal|anual)$")
    payment_token: str = Field(..., min_length=1, description="Token gerado pelo SDK do gateway (nunca o número do cartão)")
    nome_titular: str = Field(..., min_length=2, max_length=120)


class CheckoutResponse(BaseModel):
    sucesso: bool
    requer_confirmacao: bool = False
    client_secret: Optional[str] = None   # usado para 3DS do Stripe
    subscription_id: Optional[str] = None
    mensagem: str


class ConfirmarCheckoutRequest(BaseModel):
    subscription_id: str


# ---------------------------------------------------------------------------
# Gateway info (exposta ao frontend autenticado)
# ---------------------------------------------------------------------------

class GatewayInfoPublico(BaseModel):
    tipo: str                          # stripe | pagarme | mercadopago | manual
    chave_publica: Optional[str]       # public key / public token (seguro expor)
    ativo: bool


# ---------------------------------------------------------------------------
# Assinatura ativa
# ---------------------------------------------------------------------------

class AssinaturaInfo(BaseModel):
    plano: str
    ciclo: Optional[str]
    status: str
    valor_mensal: float
    proximo_vencimento: Optional[str]
    gateway: Optional[str]
    referencia_externa: Optional[str]
