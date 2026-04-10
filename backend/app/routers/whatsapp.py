import logging
import time
from collections import defaultdict
from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.models.lead import Lead
from app.models.whatsapp_message import WhatsAppMessage
from app.core.config import settings
import httpx
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# ---------------------------------------------------------------------------
# Rate limiting simples em memória: máx. 10 mensagens por número em 60 segundos
# ---------------------------------------------------------------------------
_rate_buckets: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_MAX = 10
_RATE_LIMIT_WINDOW = 60  # segundos


def _is_rate_limited(phone: str) -> bool:
    now = time.monotonic()
    timestamps = _rate_buckets[phone]
    # Remove timestamps fora da janela
    _rate_buckets[phone] = [t for t in timestamps if now - t < _RATE_LIMIT_WINDOW]
    if len(_rate_buckets[phone]) >= _RATE_LIMIT_MAX:
        return True
    _rate_buckets[phone].append(now)
    return False


# ---------------------------------------------------------------------------
# Schemas de entrada
# ---------------------------------------------------------------------------
_PHONE_RE = re.compile(r"^\d{7,15}$")

class WebhookPayload(BaseModel):
    phone: str
    message: str
    timestamp: int | None = None
    messageId: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if not _PHONE_RE.match(cleaned):
            raise ValueError("Número de telefone inválido")
        return cleaned

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if len(v) > 4096:
            raise ValueError("Mensagem muito longa (máx. 4096 caracteres)")
        return v


class WhatsAppSendPayload(BaseModel):
    phone: str
    message: str


# ---------------------------------------------------------------------------
# Helpers de domínio
# ---------------------------------------------------------------------------

def _is_first_message(db: Session, lead: Lead) -> bool:
    """Retorna True se este é o primeiro contato do lead."""
    count = db.query(WhatsAppMessage).filter(WhatsAppMessage.lead_id == lead.id).count()
    return count == 0


def _try_extract_name(message: str) -> str | None:
    """
    Tenta extrair um nome próprio de mensagens como "Me chamo João", "Meu nome é Ana" etc.
    Retorna None se não conseguir detectar com segurança.
    """
    patterns = [
        r"(?:me chamo|meu nome [eé]|pode me chamar de|sou o|sou a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)",
        r"^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)$",  # Resposta só com nome próprio
    ]
    for pat in patterns:
        m = re.search(pat, message, re.IGNORECASE)
        if m:
            name = m.group(1).strip().title()
            if len(name) >= 3:
                return name
    return None


async def _send_whatsapp_message(phone: str, message: str) -> bool:
    """Envia mensagem via Node.js service. Retorna True em caso de sucesso."""
    try:
        headers = {"x-api-key": settings.WHATSAPP_NODE_API_KEY}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.WHATSAPP_NODE_URL}/send-message",
                json={"phone": phone, "message": message},
                headers=headers,
            )
            resp.raise_for_status()
            return True
    except Exception as e:
        logger.error("Erro ao enviar mensagem ao Node.js para %s: %s", phone, e)
        return False


# ---------------------------------------------------------------------------
# Background task — usa sessão própria para evitar vazamento
# ---------------------------------------------------------------------------

async def _process_llm_response(phone: str, user_message: str, is_new_lead: bool) -> None:
    from app.services.llm_service import generate_reply_for_lead, _detect_status_transition

    db: Session = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.phone == phone).first()
        if not lead:
            logger.warning("Lead não encontrado na background task para phone=%s", phone)
            return

        if lead.is_bot_paused:
            logger.info("Bot pausado para lead_id=%s, mensagem ignorada pelo LLM.", lead.id)
            return

        # Saudação no primeiro contato — pede o nome antes de processar o LLM
        if is_new_lead:
            greeting = (
                "Olá! 👋 Sou a Lía, assistente virtual da BAI Imóveis.\n"
                "Pode me dizer seu nome para eu te atender melhor?"
            )
            success = await _send_whatsapp_message(phone, greeting)
            if success:
                out_msg = WhatsAppMessage(lead_id=lead.id, body=greeting, direction="outbound")
                db.add(out_msg)
                db.commit()
            return

        # Tenta atualizar o nome do lead se ainda for o número de telefone
        if lead.name == lead.phone:
            extracted_name = _try_extract_name(user_message)
            if extracted_name:
                lead.name = extracted_name
                db.commit()
                db.refresh(lead)
                logger.info("Nome do lead_id=%s atualizado para '%s'.", lead.id, extracted_name)

        # Verifica se a mensagem dispara transição de status
        new_status = _detect_status_transition(user_message, lead.status or "novo")
        if new_status:
            logger.info(
                "Lead_id=%s transicionou de '%s' para '%s'.",
                lead.id, lead.status, new_status,
            )
            lead.status = new_status
            db.commit()
            db.refresh(lead)

        # Gera resposta via LLM (histórico já incluído dentro do serviço)
        response_text = await generate_reply_for_lead(lead, user_message, db)

        success = await _send_whatsapp_message(phone, response_text)
        if success:
            out_msg = WhatsAppMessage(lead_id=lead.id, body=response_text, direction="outbound")
            db.add(out_msg)
            db.commit()
            logger.info("Resposta enviada para lead_id=%s (%s chars).", lead.id, len(response_text))

    except Exception as e:
        logger.exception("Erro inesperado na background task para phone=%s: %s", phone, e)
        db.rollback()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/webhook")
async def receive_webhook(
    payload: WebhookPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    phone = payload.phone

    # Rate limiting
    if _is_rate_limited(phone):
        logger.warning("Rate limit atingido para phone=%s", phone)
        return {"status": "rate_limited"}

    # Deduplicação por messageId do WhatsApp
    if payload.messageId:
        existing = (
            db.query(WhatsAppMessage)
            .filter(WhatsAppMessage.message_id == payload.messageId)
            .first()
        )
        if existing:
            logger.info("Mensagem duplicada ignorada: messageId=%s", payload.messageId)
            return {"status": "duplicate"}

    # Busca ou cria lead
    lead = db.query(Lead).filter(Lead.phone == phone).first()
    is_new_lead = lead is None
    if is_new_lead:
        lead = Lead(name=phone, phone=phone, source="whatsapp", status="contatado")
        db.add(lead)
        db.commit()
        db.refresh(lead)
        logger.info("Novo lead criado: lead_id=%s phone=%s", lead.id, phone)

    # Salva mensagem inbound
    in_msg = WhatsAppMessage(
        lead_id=lead.id,
        body=payload.message,
        direction="inbound",
        message_id=payload.messageId,
    )
    db.add(in_msg)
    db.commit()
    logger.info("Mensagem inbound salva: lead_id=%s message_id=%s", lead.id, payload.messageId)

    # Enfileira processamento LLM em background com sessão própria
    background_tasks.add_task(_process_llm_response, phone, payload.message, is_new_lead)

    return {"status": "ok"}
