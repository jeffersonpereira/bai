from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
import httpx

from app.db.database import get_db
from app.models.user import User
from app.models.whatsapp import WhatsAppSession, WhatsAppMessage
from app.schemas.whatsapp import (
    WhatsAppSessionStatus,
    WhatsAppSendRequest,
    WhatsAppMessageResponse,
    WhatsAppWebhookMessage,
    WhatsAppWebhookStatus,
)
from app.core.config import settings
from .auth import get_current_user

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

ALLOWED_ROLES = {"user", "broker", "agency", "admin"}


def _node(path: str) -> str:
    return f"{settings.WHATSAPP_NODE_URL}{path}"


def _headers() -> dict:
    return {"X-Internal-Key": settings.WHATSAPP_INTERNAL_KEY}


def _check_role(user: User) -> None:
    if user.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Perfil não autorizado para WhatsApp")


# --- Session management ---

@router.post("/session/start", response_model=WhatsAppSessionStatus)
async def start_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(_node(f"/sessions/{current_user.id}/start"), headers=_headers())
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Erro ao iniciar sessão WhatsApp")
    data = resp.json()
    return {"status": data.get("status", "connecting"), "qr": None}


@router.get("/session/status", response_model=WhatsAppSessionStatus)
async def session_status(current_user: User = Depends(get_current_user)):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            resp = await client.get(_node(f"/sessions/{current_user.id}/status"), headers=_headers())
            if resp.status_code == 200:
                return resp.json()
        except httpx.RequestError:
            pass
    return {"status": "disconnected", "qr": None}


@router.delete("/session")
async def stop_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.delete(_node(f"/sessions/{current_user.id}"), headers=_headers())
        except httpx.RequestError:
            pass
    db.query(WhatsAppSession).filter_by(user_id=current_user.id).delete()
    db.commit()
    return {"ok": True}


# --- Messaging ---

@router.post("/send")
async def send_message(
    payload: WhatsAppSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            _node(f"/sessions/{current_user.id}/send"),
            headers=_headers(),
            json={"to": payload.to, "text": payload.text},
        )
    if resp.status_code != 200:
        detail = resp.json().get("error", "Falha ao enviar mensagem")
        raise HTTPException(status_code=400, detail=detail)

    jid = resp.json().get("jid", payload.to)
    msg = WhatsAppMessage(user_id=current_user.id, chat_jid=jid, direction="out", body=payload.text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/messages", response_model=List[WhatsAppMessageResponse])
def list_messages(
    chat_jid: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    q = db.query(WhatsAppMessage).filter(WhatsAppMessage.user_id == current_user.id)
    if chat_jid:
        q = q.filter(WhatsAppMessage.chat_jid == chat_jid)
    return q.order_by(WhatsAppMessage.timestamp.desc()).limit(limit).all()


# --- Internal webhooks from Node service ---

def _verify_internal(x_internal_key: Optional[str] = Header(None)) -> None:
    if x_internal_key != settings.WHATSAPP_INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/webhook/message", include_in_schema=False)
def webhook_message(
    payload: WhatsAppWebhookMessage,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_internal),
):
    if payload.message_id:
        if db.query(WhatsAppMessage).filter_by(message_id=payload.message_id).first():
            return {"ok": True, "duplicate": True}

    ts = (
        datetime.fromtimestamp(payload.timestamp, tz=timezone.utc)
        if payload.timestamp
        else None
    )
    msg = WhatsAppMessage(
        user_id=payload.user_id,
        chat_jid=payload.from_jid,
        message_id=payload.message_id,
        direction="in",
        body=payload.body,
        timestamp=ts,
    )
    db.add(msg)
    db.commit()
    return {"ok": True}


@router.post("/webhook/status", include_in_schema=False)
def webhook_status(
    payload: WhatsAppWebhookStatus,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_internal),
):
    session = db.query(WhatsAppSession).filter_by(user_id=payload.user_id).first()
    if not session:
        session = WhatsAppSession(user_id=payload.user_id)
        db.add(session)
    session.status = payload.status
    if payload.status == "connected":
        session.connected_at = datetime.now(tz=timezone.utc)
    db.commit()
    return {"ok": True}
