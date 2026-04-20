from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WhatsAppSessionStatus(BaseModel):
    status: str
    qr: Optional[str] = None


class WhatsAppSendRequest(BaseModel):
    to: str
    text: str


class WhatsAppMessageResponse(BaseModel):
    id: int
    chat_jid: str
    direction: str
    body: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class WhatsAppWebhookMessage(BaseModel):
    user_id: int
    from_jid: str
    body: str
    timestamp: Optional[int] = None
    message_id: Optional[str] = None


class WhatsAppWebhookStatus(BaseModel):
    user_id: int
    status: str
