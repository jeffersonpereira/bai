"""
Handlers de checkout por gateway.

Fluxo PCI-seguro:
  1. O gateway JS (Stripe.js / PagarmeJS / MP SDK) tokeniza o cartão no navegador.
  2. O frontend envia apenas o token ao backend — número do cartão jamais chega aqui.
  3. O backend usa a chave privada + token para criar a assinatura via API do gateway.
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.usuario import Usuario
from app.models.pagamento import Pagamento
from app.core.planos import PRECOS_PLANO


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _calcular_expiracao(ciclo: str) -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(year=now.year + 1) if ciclo == "anual" else now + timedelta(days=31)


def _preco_centavos(plano: str, ciclo: str) -> int:
    p = PRECOS_PLANO[plano]
    valor = p["anual"] * 12 if ciclo == "anual" else p["mensal"]
    return int(valor * 100)


def _registrar(db: Session, usuario_id: int, gateway: str, plano: str, ciclo: str,
               status: str, referencia: str | None, customer_id: str | None) -> Pagamento:
    pag = Pagamento(
        usuario_id=usuario_id,
        gateway=gateway,
        valor_centavos=_preco_centavos(plano, ciclo),
        status=status,
        plano_contratado=plano,
        ciclo=ciclo,
        referencia_externa=referencia,
        customer_id_externo=customer_id,
    )
    db.add(pag)
    db.commit()
    return pag


def _ativar_plano(db: Session, usuario: Usuario, plano: str, ciclo: str) -> None:
    usuario.tipo_plano = plano
    usuario.plano_expira_em = _calcular_expiracao(ciclo)
    db.commit()
    db.refresh(usuario)


def _customer_id_salvo(db: Session, usuario_id: int, gateway: str) -> str | None:
    pag = (
        db.query(Pagamento)
        .filter(
            Pagamento.usuario_id == usuario_id,
            Pagamento.gateway == gateway,
            Pagamento.customer_id_externo.isnot(None),
        )
        .order_by(Pagamento.criado_em.desc())
        .first()
    )
    return pag.customer_id_externo if pag else None


# ---------------------------------------------------------------------------
# Stripe
# ---------------------------------------------------------------------------

def checkout_stripe(
    db: Session, usuario: Usuario, plano: str, ciclo: str,
    payment_method_id: str, gw: dict,
) -> dict:
    try:
        import stripe  # pip install stripe
    except ImportError:
        raise HTTPException(500, "SDK Stripe não instalado. Execute: pip install stripe")

    stripe.api_key = gw.get("gateway_chave_privada")
    if not stripe.api_key:
        raise HTTPException(500, "Chave privada do Stripe não configurada.")

    price_id = gw.get(f"stripe_price_{plano}_{ciclo}")
    if not price_id:
        raise HTTPException(
            400,
            f"Price ID do Stripe para '{plano}/{ciclo}' não configurado. "
            "Acesse Admin > Configurações > Gateway e preencha os IDs de preço.",
        )

    try:
        customer_id = _customer_id_salvo(db, usuario.id, "stripe")
        if customer_id:
            stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)
            stripe.Customer.modify(
                customer_id,
                invoice_settings={"default_payment_method": payment_method_id},
            )
        else:
            customer = stripe.Customer.create(
                email=usuario.email,
                name=usuario.nome or usuario.email,
                payment_method=payment_method_id,
                invoice_settings={"default_payment_method": payment_method_id},
            )
            customer_id = customer.id

        sub = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            expand=["latest_invoice.payment_intent"],
        )

        sub_id = sub.get("id") if isinstance(sub, dict) else sub.id
        pi = (sub.get("latest_invoice") or {}).get("payment_intent") if isinstance(sub, dict) else \
             getattr(getattr(sub, "latest_invoice", None), "payment_intent", None)
        pi_status = (pi.get("status") if isinstance(pi, dict) else getattr(pi, "status", None)) or ""
        client_secret = (pi.get("client_secret") if isinstance(pi, dict) else getattr(pi, "client_secret", None))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Erro Stripe: {e}")

    if pi_status in ("requires_action", "requires_payment_method"):
        _registrar(db, usuario.id, "stripe", plano, ciclo, "pendente", sub_id, customer_id)
        return {
            "sucesso": False,
            "requer_confirmacao": True,
            "client_secret": client_secret,
            "subscription_id": sub_id,
            "mensagem": "Autenticação 3DS necessária. Confirme no seu banco.",
        }

    _ativar_plano(db, usuario, plano, ciclo)
    _registrar(db, usuario.id, "stripe", plano, ciclo, "aprovado", sub_id, customer_id)
    return {
        "sucesso": True,
        "requer_confirmacao": False,
        "client_secret": None,
        "subscription_id": sub_id,
        "mensagem": "Assinatura ativada com sucesso!",
    }


# ---------------------------------------------------------------------------
# Pagar.me v5
# ---------------------------------------------------------------------------

def checkout_pagarme(
    db: Session, usuario: Usuario, plano: str, ciclo: str,
    card_hash: str, gw: dict,
) -> dict:
    api_key = gw.get("gateway_chave_privada")
    if not api_key:
        raise HTTPException(500, "Chave privada do Pagar.me não configurada.")

    plan_id = gw.get(f"pagarme_plan_{plano}_{ciclo}")
    if not plan_id:
        raise HTTPException(
            400,
            f"Plan ID do Pagar.me para '{plano}/{ciclo}' não configurado. "
            "Acesse Admin > Configurações > Gateway.",
        )

    try:
        import httpx
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "customer": {
                "name": usuario.nome or usuario.email,
                "email": usuario.email,
                "type": "individual",
            },
            "plan_id": plan_id,
            "payment_method": "credit_card",
            "credit_card": {"card_hash": card_hash},
        }
        r = httpx.post(
            "https://api.pagar.me/core/v5/subscriptions",
            json=payload, headers=headers, timeout=30,
        )
        r.raise_for_status()
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Erro Pagar.me: {e}")

    sub_id = data.get("id", "")
    customer_id = (data.get("customer") or {}).get("id", "")
    status_gw = data.get("status", "")

    if status_gw not in ("active", "paid"):
        _registrar(db, usuario.id, "pagarme", plano, ciclo, "falhou", sub_id, customer_id)
        raise HTTPException(402, f"Pagamento recusado pelo Pagar.me (status: {status_gw}).")

    _ativar_plano(db, usuario, plano, ciclo)
    _registrar(db, usuario.id, "pagarme", plano, ciclo, "aprovado", sub_id, customer_id)
    return {
        "sucesso": True,
        "requer_confirmacao": False,
        "client_secret": None,
        "subscription_id": sub_id,
        "mensagem": "Assinatura ativada com sucesso!",
    }


# ---------------------------------------------------------------------------
# Mercado Pago
# ---------------------------------------------------------------------------

def checkout_mercadopago(
    db: Session, usuario: Usuario, plano: str, ciclo: str,
    card_token: str, gw: dict,
) -> dict:
    access_token = gw.get("gateway_chave_privada")
    if not access_token:
        raise HTTPException(500, "Access token do Mercado Pago não configurado.")

    plan_id = gw.get(f"mercadopago_plan_{plano}_{ciclo}")
    if not plan_id:
        raise HTTPException(
            400,
            f"Plano do Mercado Pago para '{plano}/{ciclo}' não configurado. "
            "Acesse Admin > Configurações > Gateway.",
        )

    try:
        import httpx
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = {
            "preapproval_plan_id": plan_id,
            "payer_email": usuario.email,
            "card_token_id": card_token,
            "status": "authorized",
        }
        r = httpx.post(
            "https://api.mercadopago.com/preapproval",
            json=payload, headers=headers, timeout=30,
        )
        r.raise_for_status()
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Erro Mercado Pago: {e}")

    sub_id = data.get("id", "")
    status_gw = data.get("status", "")

    if status_gw != "authorized":
        _registrar(db, usuario.id, "mercadopago", plano, ciclo, "falhou", sub_id, usuario.email)
        raise HTTPException(402, f"Pagamento recusado pelo Mercado Pago (status: {status_gw}).")

    _ativar_plano(db, usuario, plano, ciclo)
    _registrar(db, usuario.id, "mercadopago", plano, ciclo, "aprovado", sub_id, usuario.email)
    return {
        "sucesso": True,
        "requer_confirmacao": False,
        "client_secret": None,
        "subscription_id": sub_id,
        "mensagem": "Assinatura ativada com sucesso!",
    }


# ---------------------------------------------------------------------------
# Dispatcher principal
# ---------------------------------------------------------------------------

def processar_checkout(
    db: Session, usuario: Usuario, plano: str, ciclo: str,
    payment_token: str, gw: dict,
) -> dict:
    if plano not in ("pro", "premium"):
        raise HTTPException(400, "Plano inválido.")
    if ciclo not in ("mensal", "anual"):
        raise HTTPException(400, "Ciclo inválido.")
    if (usuario.tipo_plano or "gratuito") == plano:
        raise HTTPException(400, "Você já está neste plano.")

    tipo = gw.get("gateway_tipo", "manual")
    if not gw.get("gateway_ativo") and tipo != "manual":
        raise HTTPException(503, "Gateway de pagamento desativado. Contate o suporte.")

    if tipo == "stripe":
        return checkout_stripe(db, usuario, plano, ciclo, payment_token, gw)
    if tipo == "pagarme":
        return checkout_pagarme(db, usuario, plano, ciclo, payment_token, gw)
    if tipo == "mercadopago":
        return checkout_mercadopago(db, usuario, plano, ciclo, payment_token, gw)

    raise HTTPException(
        503,
        "Gateway configurado como 'manual'. Entre em contato com o suporte para upgrade.",
    )


# ---------------------------------------------------------------------------
# Confirmação pós-3DS (Stripe)
# ---------------------------------------------------------------------------

def confirmar_stripe(db: Session, usuario: Usuario, subscription_id: str, gw: dict) -> dict:
    try:
        import stripe
        stripe.api_key = gw.get("gateway_chave_privada")
        sub = stripe.Subscription.retrieve(subscription_id)
        status = sub.get("status") if isinstance(sub, dict) else sub.status
    except Exception as e:
        raise HTTPException(502, f"Erro ao confirmar assinatura Stripe: {e}")

    if status != "active":
        raise HTTPException(402, f"Assinatura ainda não ativa (status: {status}).")

    # Atualiza pagamento pendente
    pag = (
        db.query(Pagamento)
        .filter(
            Pagamento.usuario_id == usuario.id,
            Pagamento.referencia_externa == subscription_id,
            Pagamento.status == "pendente",
        )
        .first()
    )
    if not pag:
        raise HTTPException(status_code=404, detail="Pagamento pendente não encontrado para esta assinatura.")

    pag.status = "aprovado"
    db.commit()

    _ativar_plano(db, usuario, pag.plano_contratado, pag.ciclo)
    return {"sucesso": True, "mensagem": "Assinatura confirmada e plano ativado!"}
