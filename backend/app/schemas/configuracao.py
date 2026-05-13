from pydantic import BaseModel
from typing import Optional


class GatewayConfigAtualizar(BaseModel):
    gateway_tipo: str               # stripe | pagarme | mercadopago | manual
    gateway_chave_publica: Optional[str] = None
    gateway_chave_privada: Optional[str] = None   # write-only; nunca retornado
    gateway_webhook_secret: Optional[str] = None  # write-only
    gateway_ativo: bool = False
    gateway_ambiente: str = "sandbox"              # sandbox | producao

    # Stripe — Price IDs criados no dashboard do Stripe
    stripe_price_pro_mensal: Optional[str] = None
    stripe_price_pro_anual: Optional[str] = None
    stripe_price_premium_mensal: Optional[str] = None
    stripe_price_premium_anual: Optional[str] = None

    # Pagar.me — Plan IDs criados no dashboard do Pagar.me
    pagarme_plan_pro_mensal: Optional[str] = None
    pagarme_plan_pro_anual: Optional[str] = None
    pagarme_plan_premium_mensal: Optional[str] = None
    pagarme_plan_premium_anual: Optional[str] = None

    # Mercado Pago — Preapproval Plan IDs
    mercadopago_plan_pro_mensal: Optional[str] = None
    mercadopago_plan_pro_anual: Optional[str] = None
    mercadopago_plan_premium_mensal: Optional[str] = None
    mercadopago_plan_premium_anual: Optional[str] = None


class GatewayConfigResposta(BaseModel):
    gateway_tipo: str
    gateway_chave_publica: Optional[str]
    chave_privada_configurada: bool
    webhook_secret_configurado: bool
    gateway_ativo: bool
    gateway_ambiente: str

    # IDs de planos/preços (não-sensíveis)
    stripe_price_pro_mensal: Optional[str] = None
    stripe_price_pro_anual: Optional[str] = None
    stripe_price_premium_mensal: Optional[str] = None
    stripe_price_premium_anual: Optional[str] = None

    pagarme_plan_pro_mensal: Optional[str] = None
    pagarme_plan_pro_anual: Optional[str] = None
    pagarme_plan_premium_mensal: Optional[str] = None
    pagarme_plan_premium_anual: Optional[str] = None

    mercadopago_plan_pro_mensal: Optional[str] = None
    mercadopago_plan_pro_anual: Optional[str] = None
    mercadopago_plan_premium_mensal: Optional[str] = None
    mercadopago_plan_premium_anual: Optional[str] = None


class PlataformaConfigAtualizar(BaseModel):
    plataforma_nome: Optional[str] = None
    plataforma_email_suporte: Optional[str] = None


class ConfiguracaoSistemaResposta(BaseModel):
    gateway: GatewayConfigResposta
    plataforma_nome: Optional[str]
    plataforma_email_suporte: Optional[str]


class TesteGatewayResposta(BaseModel):
    sucesso: bool
    mensagem: str
