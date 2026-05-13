import json
from sqlalchemy.orm import Session

from app.models.configuracao import ConfiguracaoSistema
from app.schemas.configuracao import GatewayConfigAtualizar, PlataformaConfigAtualizar

_GATEWAY_KEY = "gateway_config"
_PLATAFORMA_NOME_KEY = "plataforma_nome"
_PLATAFORMA_EMAIL_KEY = "plataforma_email_suporte"

_GATEWAYS_SUPORTADOS = {"stripe", "pagarme", "mercadopago", "manual"}

# Campos de IDs de planos/preços (não-sensíveis, podem aparecer na resposta)
_PRICE_ID_FIELDS = [
    "stripe_price_pro_mensal", "stripe_price_pro_anual",
    "stripe_price_premium_mensal", "stripe_price_premium_anual",
    "pagarme_plan_pro_mensal", "pagarme_plan_pro_anual",
    "pagarme_plan_premium_mensal", "pagarme_plan_premium_anual",
    "mercadopago_plan_pro_mensal", "mercadopago_plan_pro_anual",
    "mercadopago_plan_premium_mensal", "mercadopago_plan_premium_anual",
]


def _get(db: Session, chave: str) -> str | None:
    item = db.query(ConfiguracaoSistema).filter(ConfiguracaoSistema.chave == chave).first()
    return item.valor if item else None


def _set(db: Session, chave: str, valor: str, descricao: str = "", tipo: str = "string") -> None:
    item = db.query(ConfiguracaoSistema).filter(ConfiguracaoSistema.chave == chave).first()
    if item:
        item.valor = valor
    else:
        item = ConfiguracaoSistema(chave=chave, valor=valor, descricao=descricao, tipo=tipo)
        db.add(item)
    db.commit()


def _gateway_raw(db: Session) -> dict:
    raw = _get(db, _GATEWAY_KEY)
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass
    return {
        "gateway_tipo": "manual",
        "gateway_chave_publica": None,
        "gateway_chave_privada": None,
        "gateway_webhook_secret": None,
        "gateway_ativo": False,
        "gateway_ambiente": "sandbox",
    }


def obter_gateway_raw(db: Session) -> dict:
    """Exposto para o checkout_service — retorna dados completos incluindo chave privada."""
    return _gateway_raw(db)


def obter_configuracoes(db: Session) -> dict:
    gw = _gateway_raw(db)
    gateway_resposta = {
        "gateway_tipo": gw.get("gateway_tipo", "manual"),
        "gateway_chave_publica": gw.get("gateway_chave_publica"),
        "chave_privada_configurada": bool(gw.get("gateway_chave_privada")),
        "webhook_secret_configurado": bool(gw.get("gateway_webhook_secret")),
        "gateway_ativo": gw.get("gateway_ativo", False),
        "gateway_ambiente": gw.get("gateway_ambiente", "sandbox"),
    }
    for field in _PRICE_ID_FIELDS:
        gateway_resposta[field] = gw.get(field)

    return {
        "gateway": gateway_resposta,
        "plataforma_nome": _get(db, _PLATAFORMA_NOME_KEY),
        "plataforma_email_suporte": _get(db, _PLATAFORMA_EMAIL_KEY),
    }


def atualizar_gateway(db: Session, dados: GatewayConfigAtualizar) -> dict:
    if dados.gateway_tipo not in _GATEWAYS_SUPORTADOS:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"Gateway inválido. Suportados: {sorted(_GATEWAYS_SUPORTADOS)}",
        )

    gw = _gateway_raw(db)
    gw["gateway_tipo"] = dados.gateway_tipo
    gw["gateway_ativo"] = dados.gateway_ativo
    gw["gateway_ambiente"] = dados.gateway_ambiente

    if dados.gateway_chave_publica is not None:
        gw["gateway_chave_publica"] = dados.gateway_chave_publica
    if dados.gateway_chave_privada is not None:
        gw["gateway_chave_privada"] = dados.gateway_chave_privada
    if dados.gateway_webhook_secret is not None:
        gw["gateway_webhook_secret"] = dados.gateway_webhook_secret

    # Persistir price/plan IDs
    for field in _PRICE_ID_FIELDS:
        valor = getattr(dados, field, None)
        if valor is not None:
            gw[field] = valor

    _set(db, _GATEWAY_KEY, json.dumps(gw), "Configuração do gateway de pagamento", "json")
    return obter_configuracoes(db)


def atualizar_plataforma(db: Session, dados: PlataformaConfigAtualizar) -> dict:
    if dados.plataforma_nome is not None:
        _set(db, _PLATAFORMA_NOME_KEY, dados.plataforma_nome, "Nome da plataforma")
    if dados.plataforma_email_suporte is not None:
        _set(db, _PLATAFORMA_EMAIL_KEY, dados.plataforma_email_suporte, "E-mail de suporte")
    return obter_configuracoes(db)


def testar_gateway(db: Session) -> dict:
    gw = _gateway_raw(db)
    tipo = gw.get("gateway_tipo", "manual")

    if tipo == "manual":
        return {"sucesso": True, "mensagem": "Gateway manual não requer conexão externa."}
    if not gw.get("gateway_ativo"):
        return {"sucesso": False, "mensagem": "Gateway está desativado. Ative-o antes de testar."}
    if not gw.get("gateway_chave_privada"):
        return {"sucesso": False, "mensagem": "Chave privada não configurada."}

    return {
        "sucesso": True,
        "mensagem": (
            f"Credenciais do gateway '{tipo}' salvas. "
            "Implemente a chamada de ping específica do SDK para validação em produção."
        ),
    }
