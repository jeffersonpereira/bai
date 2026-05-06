from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.cobranca import (
    ConsumoResponse, PlanoInfo,
    CheckoutRequest, CheckoutResponse, ConfirmarCheckoutRequest,
    GatewayInfoPublico, AssinaturaInfo,
)
from app.services import cobranca_service
from app.services import checkout_service
from app.services import configuracao_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/cobranca", tags=["cobranca"])


@router.get("/consumo", response_model=ConsumoResponse)
def get_consumo(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return cobranca_service.obter_consumo(db, current_user)


@router.get("/planos", response_model=list[PlanoInfo])
def get_planos():
    return cobranca_service.listar_planos()


@router.get("/assinatura", response_model=AssinaturaInfo)
def get_assinatura(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return cobranca_service.obter_assinatura(db, current_user)


@router.get("/gateway-info", response_model=GatewayInfoPublico)
def get_gateway_info(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Retorna tipo e chave pública do gateway — seguro para expor ao frontend autenticado."""
    gw = configuracao_service.obter_gateway_raw(db)
    return {
        "tipo": gw.get("gateway_tipo", "manual"),
        "chave_publica": gw.get("gateway_chave_publica"),
        "ativo": gw.get("gateway_ativo", False),
    }


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(
    body: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Processa a assinatura de um plano pago.

    O `payment_token` deve ser gerado pelo SDK do gateway no navegador:
    - Stripe: `payment_method_id` de `stripe.createPaymentMethod()`
    - Pagar.me: `card_hash` do SDK Pagar.me
    - Mercado Pago: `card_token_id` do SDK MP

    O número do cartão NUNCA deve ser enviado aqui.
    """
    gw = configuracao_service.obter_gateway_raw(db)
    return checkout_service.processar_checkout(
        db, current_user, body.plano, body.ciclo, body.payment_token, gw,
    )


@router.post("/checkout/confirmar", response_model=CheckoutResponse)
def confirmar_checkout(
    body: ConfirmarCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Confirma assinatura Stripe após autenticação 3DS no frontend."""
    gw = configuracao_service.obter_gateway_raw(db)
    result = checkout_service.confirmar_stripe(db, current_user, body.subscription_id, gw)
    return {**result, "requer_confirmacao": False, "client_secret": None, "subscription_id": body.subscription_id}


@router.post("/webhook/stripe")
async def webhook_stripe(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint de webhook para eventos assíncronos do Stripe.
    Configure esta URL no dashboard do Stripe: POST /api/v1/cobranca/webhook/stripe
    """
    import json
    from app.models.pagamento import Pagamento

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    gw = configuracao_service.obter_gateway_raw(db)
    webhook_secret = gw.get("gateway_webhook_secret")

    if not webhook_secret:
        raise HTTPException(status_code=400, detail="webhook_secret não configurado — configure-o em Admin > Configurações > Gateway.")

    try:
        import stripe
        stripe.api_key = gw.get("gateway_chave_privada")
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event.get("type") if isinstance(event, dict) else event.type

    if event_type == "invoice.payment_succeeded":
        invoice = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
        sub_id = invoice.get("subscription") if isinstance(invoice, dict) else getattr(invoice, "subscription", None)
        if sub_id:
            pag = db.query(Pagamento).filter(
                Pagamento.referencia_externa == sub_id,
                Pagamento.status == "pendente",
            ).first()
            if pag:
                pag.status = "aprovado"
                usuario = db.query(Usuario).filter_by(id=pag.usuario_id).first()
                if usuario:
                    from app.services.checkout_service import _ativar_plano
                    _ativar_plano(db, usuario, pag.plano_contratado, pag.ciclo)
                db.commit()

    elif event_type == "customer.subscription.deleted":
        sub = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
        sub_id = sub.get("id") if isinstance(sub, dict) else getattr(sub, "id", None)
        if sub_id:
            pag = db.query(Pagamento).filter(Pagamento.referencia_externa == sub_id).first()
            if pag:
                pag.status = "cancelado"
                usuario = db.query(Usuario).filter_by(id=pag.usuario_id).first()
                if usuario:
                    usuario.tipo_plano = "gratuito"
                    usuario.plano_expira_em = None
                db.commit()

    return {"received": True}
