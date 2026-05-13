from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Session ────────────────────────────────────────────────────────────────────

class WhatsAppSessionStatus(BaseModel):
    status: str
    qr: Optional[str] = None


class WhatsAppSendRequest(BaseModel):
    to: str
    text: str


class WhatsAppMessageResponse(BaseModel):
    id: int
    jid_conversa: str
    direcao: str
    conteudo: str
    enviado_em: datetime

    model_config = {"from_attributes": True}


class WhatsAppWebhookMessage(BaseModel):
    user_id: int
    from_jid: str
    body: str
    timestamp: Optional[int] = None
    message_id: Optional[str] = None
    push_name: Optional[str] = None


class WhatsAppWebhookStatus(BaseModel):
    user_id: int
    status: str


# ── Contatos ───────────────────────────────────────────────────────────────────

class ContatoCreate(BaseModel):
    nome: str
    telefone: str
    email: Optional[str] = None
    notas: Optional[str] = None


class ContatoUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    notas: Optional[str] = None


class ContatoResponse(BaseModel):
    id: int
    nome: str
    telefone: str
    email: Optional[str] = None
    notas: Optional[str] = None
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Respostas Rápidas ──────────────────────────────────────────────────────────

class RespostaRapidaCreate(BaseModel):
    atalho: str
    mensagem: str


class RespostaRapidaUpdate(BaseModel):
    atalho: Optional[str] = None
    mensagem: Optional[str] = None


class RespostaRapidaResponse(BaseModel):
    id: int
    atalho: str
    mensagem: str
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Tags ───────────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    nome: str
    cor: str = "bg-emerald-500"


class TagUpdate(BaseModel):
    nome: Optional[str] = None
    cor: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    nome: str
    cor: str
    criado_em: datetime

    model_config = {"from_attributes": True}


class TagConversaCreate(BaseModel):
    jid_conversa: str


# ── Filas ──────────────────────────────────────────────────────────────────────

class FilaCreate(BaseModel):
    nome: str
    cor: str = "#10b981"
    saudacao: Optional[str] = None


class FilaUpdate(BaseModel):
    nome: Optional[str] = None
    cor: Optional[str] = None
    saudacao: Optional[str] = None


class FilaResponse(BaseModel):
    id: int
    nome: str
    cor: str
    saudacao: Optional[str] = None
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Agendamentos ───────────────────────────────────────────────────────────────

class AgendamentoCreate(BaseModel):
    destinatario: str
    mensagem: str
    agendado_para: datetime


class AgendamentoResponse(BaseModel):
    id: int
    destinatario: str
    mensagem: str
    agendado_para: datetime
    situacao: str
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Campanhas ──────────────────────────────────────────────────────────────────

class CampanhaCreate(BaseModel):
    nome: str
    mensagem: str


class CampanhaUpdate(BaseModel):
    nome: Optional[str] = None
    mensagem: Optional[str] = None
    situacao: Optional[str] = None


class CampanhaResponse(BaseModel):
    id: int
    nome: str
    mensagem: str
    situacao: str
    total_envios: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class ListaContatosCreate(BaseModel):
    nome: str


class ListaContatosResponse(BaseModel):
    id: int
    nome: str
    criado_em: datetime
    total: int = 0

    model_config = {"from_attributes": True}


class ItemListaCreate(BaseModel):
    nome: Optional[str] = None
    telefone: str


class ItemListaResponse(BaseModel):
    id: int
    nome: Optional[str] = None
    telefone: str

    model_config = {"from_attributes": True}


# ── Configurações ──────────────────────────────────────────────────────────────

class HorarioCreate(BaseModel):
    dia_semana: int
    inicio: str
    fim: str
    ativo: bool


class HorarioResponse(BaseModel):
    id: int
    dia_semana: int
    inicio: str
    fim: str
    ativo: bool

    model_config = {"from_attributes": True}


class ConfigUpdate(BaseModel):
    mensagem_fora_horario: Optional[str] = None
    intervalo_campanha_seg: Optional[int] = None
    variacao_campanha_seg: Optional[int] = None


class ConfigResponse(BaseModel):
    mensagem_fora_horario: Optional[str] = None
    intervalo_campanha_seg: int = 5
    variacao_campanha_seg: int = 3

    model_config = {"from_attributes": True}
