from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.lead import Lead
from app.models.whatsapp_message import WhatsAppMessage
from pydantic import BaseModel
import httpx
from datetime import datetime

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

class WebhookPayload(BaseModel):
    phone: str
    message: str
    timestamp: int | None = None
    messageId: str | None = None

class WhatsAppSendPayload(BaseModel):
    phone: str
    message: str

# Esta função será chamada no webhook e processa a mensagem via LLM
async def process_llm_response(phone: str, user_message: str, db: Session):
    # Buscar ou criar lead
    lead = db.query(Lead).filter(Lead.phone == phone).first()
    if not lead:
        lead = Lead(name=phone, phone=phone, source="whatsapp")
        db.add(lead)
        db.commit()
        db.refresh(lead)

    # Verifica se o bot está pausado
    if lead.is_bot_paused:
        print(f"[{phone}] Bot está pausado. Salvo apenas no histórico.")
        return

    from app.services.llm_service import generate_reply_for_lead
    response_text = await generate_reply_for_lead(lead, user_message, db)

    # Simular o disparo agendado
    try:
        import os
        node_url = os.environ.get("WHATSAPP_NODE_URL", "http://127.0.0.1:40002")
        async with httpx.AsyncClient() as client:
            await client.post(f"{node_url}/send-message", json={
                "phone": phone,
                "message": response_text
            })
            
            # Salvar mensagem outbound
            out_msg = WhatsAppMessage(lead_id=lead.id, body=response_text, direction="outbound")
            db.add(out_msg)
            db.commit()

    except Exception as e:
        print(f"Erro ao falar com Node.js: {e}")

@router.post("/webhook")
async def receive_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    print(f"WEBHOOK RECEBIDO: {payload.phone} -> {payload.message}")
    
    # Busca Lead e Salva a Inbound
    lead = db.query(Lead).filter(Lead.phone == payload.phone).first()
    
    # Precisamos criar Lead imediatamente se não existe?
    if not lead:
        lead = Lead(name=payload.phone, phone=payload.phone, source="whatsapp")
        db.add(lead)
        db.commit()
        db.refresh(lead)
        
    in_msg = WhatsAppMessage(lead_id=lead.id, body=payload.message, direction="inbound")
    db.add(in_msg)
    db.commit()

    # Passa pra Backgroound a chamada da IA (que pode demorar uns segundos)
    background_tasks.add_task(process_llm_response, payload.phone, payload.message, db)

    return {"status": "ok"}
