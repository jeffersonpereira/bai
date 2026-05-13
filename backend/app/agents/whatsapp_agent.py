"""
Agente de WhatsApp Conversacional.

Intercepta mensagens recebidas, responde automaticamente com contexto do
imóvel e qualifica o lead usando a API da Anthropic (Claude).

Proteções embutidas:
- Silencia se corretor respondeu manualmente nas últimas 2 horas.
- Silencia se lead já está em visita/proposta/fechado/perdido.
- Limita a 5 respostas automáticas por conversa para evitar loop.
- Falha silenciosa se ANTHROPIC_API_KEY não estiver configurada.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.lead import Lead
from app.models.imovel import Imovel
from app.models.whatsapp import WhatsAppMessage

logger = logging.getLogger(__name__)

_SITUACOES_BLOQUEADAS = {"visita", "proposta", "fechado", "perdido"}
_MAX_AUTO_RESPOSTAS = 5
_JANELA_SILENCIO_HORAS = 2


def _node_url(path: str) -> str:
    return f"{settings.WHATSAPP_NODE_URL}{path}"


def _node_headers() -> dict:
    return {"X-Internal-Key": settings.WHATSAPP_INTERNAL_KEY}


def _buscar_historico(db: Session, usuario_id: int, jid: str, limit: int = 12) -> list[dict]:
    msgs = (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.usuario_id == usuario_id,
            WhatsAppMessage.jid_conversa == jid,
        )
        .order_by(WhatsAppMessage.enviado_em.asc())
        .limit(limit)
        .all()
    )
    historico = []
    for m in msgs:
        role = "user" if m.direcao == "entrada" else "assistant"
        historico.append({"role": role, "content": m.conteudo or ""})
    return historico


def _corretor_respondeu_recentemente(db: Session, usuario_id: int, jid: str) -> bool:
    corte = datetime.now(tz=timezone.utc) - timedelta(hours=_JANELA_SILENCIO_HORAS)
    return (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.usuario_id == usuario_id,
            WhatsAppMessage.jid_conversa == jid,
            WhatsAppMessage.direcao == "saida",
            WhatsAppMessage.enviado_em >= corte,
        )
        .first()
        is not None
    )


def _contar_auto_respostas(db: Session, usuario_id: int, jid: str) -> int:
    corte = datetime.now(tz=timezone.utc) - timedelta(hours=24)
    return (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.usuario_id == usuario_id,
            WhatsAppMessage.jid_conversa == jid,
            WhatsAppMessage.direcao == "saida",
            WhatsAppMessage.enviado_em >= corte,
        )
        .count()
    )


def _buscar_lead(db: Session, usuario_id: int, telefone: str) -> Optional[Lead]:
    return (
        db.query(Lead)
        .filter(Lead.corretor_id == usuario_id, Lead.telefone == telefone)
        .order_by(Lead.criado_em.desc())
        .first()
    )


def _buscar_imovel(db: Session, imovel_id: int) -> Optional[Imovel]:
    return db.query(Imovel).filter(Imovel.id == imovel_id).first()


def _montar_contexto_imovel(imovel: Optional[Imovel]) -> str:
    if not imovel:
        return "Nenhum imóvel específico associado a esta conversa. Responda de forma genérica sobre os serviços imobiliários."
    preco = f"R$ {float(imovel.preco):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    area = f"{float(imovel.area)} m²" if imovel.area else "não informada"
    linhas = [
        f"Imóvel em destaque: {imovel.titulo}",
        f"Tipo: {imovel.tipo_imovel}",
        f"Preço: {preco}",
        f"Localização: {imovel.bairro}, {imovel.cidade}",
        f"Área: {area}",
        f"Quartos: {imovel.quartos or 'não informado'}",
    ]
    if imovel.descricao:
        linhas.append(f"Descrição: {imovel.descricao[:400]}")
    return "\n".join(linhas)


def _montar_system_prompt(nome_corretor: str, contexto_imovel: str) -> str:
    return f"""Você é um assistente imobiliário virtual de {nome_corretor}. Seu papel é:
1. Responder perguntas sobre o imóvel de forma clara e honesta.
2. Qualificar o interessado descobrindo: orçamento, prazo para mudança e se precisa de financiamento.
3. Oferecer agendamento de visita quando o lead estiver qualificado.

CONTEXTO DO IMÓVEL:
{contexto_imovel}

REGRAS IMPORTANTES:
- Use linguagem informal mas profissional. Responda em português brasileiro.
- Seja conciso (máx 3 frases por mensagem).
- Não invente informações que não estejam no contexto acima.
- Quando souber orçamento e prazo do interessado, use a ferramenta update_lead_status.
- Se o interessado pedir para falar com um humano, avise que o corretor entrará em contato em breve e use update_lead_status com "contatado".
- Não responda perguntas fora do contexto imobiliário."""


async def _enviar_resposta(usuario_id: int, jid: str, texto: str, db: Session) -> None:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            _node_url(f"/sessions/{usuario_id}/send"),
            headers=_node_headers(),
            json={"to": jid, "text": texto},
        )
    if resp.status_code != 200:
        logger.warning("WhatsApp agent: falha ao enviar resposta — %s", resp.text)
        return

    jid_retornado = resp.json().get("jid", jid)
    msg = WhatsAppMessage(
        usuario_id=usuario_id,
        jid_conversa=jid_retornado,
        direcao="saida",
        conteudo=texto,
        enviado_em=datetime.now(tz=timezone.utc),
    )
    db.add(msg)
    db.commit()


def _atualizar_lead(db: Session, lead: Lead, situacao: str, observacoes: Optional[str]) -> None:
    lead.situacao = situacao
    if observacoes:
        existing = lead.observacoes or ""
        lead.observacoes = f"{existing}\n[IA] {observacoes}".strip()
    db.commit()


async def handle_incoming_message(
    db: Session,
    usuario_id: int,
    from_jid: str,
    push_name: Optional[str],
) -> None:
    """Ponto de entrada chamado pelo webhook após salvar a mensagem recebida."""

    if not settings.ANTHROPIC_API_KEY:
        return

    try:
        import anthropic
    except ImportError:
        logger.warning("WhatsApp agent: pacote 'anthropic' não instalado.")
        return

    telefone = from_jid.split("@")[0]

    # Verificações de proteção
    if _corretor_respondeu_recentemente(db, usuario_id, from_jid):
        return

    if _contar_auto_respostas(db, usuario_id, from_jid) >= _MAX_AUTO_RESPOSTAS:
        logger.info("WhatsApp agent: limite de respostas automáticas atingido para %s", from_jid)
        return

    lead = _buscar_lead(db, usuario_id, telefone)
    if lead and lead.situacao in _SITUACOES_BLOQUEADAS:
        return

    imovel = _buscar_imovel(db, lead.imovel_id) if lead and lead.imovel_id else None

    from app.models.usuario import Usuario
    corretor = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    nome_corretor = corretor.nome if corretor else "nossa imobiliária"

    system_prompt = _montar_system_prompt(nome_corretor, _montar_contexto_imovel(imovel))
    historico = _buscar_historico(db, usuario_id, from_jid)

    if not historico:
        return

    # Garante alternância correta de roles para a API
    mensagens_api: list[dict] = []
    for msg in historico:
        if mensagens_api and mensagens_api[-1]["role"] == msg["role"]:
            mensagens_api[-1]["content"] += f"\n{msg['content']}"
        else:
            mensagens_api.append({"role": msg["role"], "content": msg["content"]})

    if not mensagens_api or mensagens_api[-1]["role"] != "user":
        return

    tools = [
        {
            "name": "send_whatsapp_reply",
            "description": "Envia uma mensagem de resposta para o contato no WhatsApp.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Texto da resposta a enviar"}
                },
                "required": ["message"],
            },
        },
        {
            "name": "update_lead_status",
            "description": "Atualiza o status do lead no CRM após qualificação ou pedido de contato humano.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "situacao": {
                        "type": "string",
                        "enum": ["novo", "contatado", "visita", "proposta", "perdido"],
                        "description": "Novo status do lead",
                    },
                    "observacoes": {
                        "type": "string",
                        "description": "Resumo da qualificação (orçamento, prazo, financiamento)",
                    },
                },
                "required": ["situacao"],
            },
        },
    ]

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=system_prompt,
            tools=tools,
            messages=mensagens_api,
        )
    except Exception as exc:
        logger.error("WhatsApp agent: erro na chamada à API Anthropic — %s", exc)
        return

    # Processa as ações retornadas pelo modelo
    for block in response.content:
        if block.type == "text" and block.text.strip():
            await _enviar_resposta(usuario_id, from_jid, block.text.strip(), db)

        elif block.type == "tool_use":
            if block.name == "send_whatsapp_reply":
                texto = block.input.get("message", "").strip()
                if texto:
                    await _enviar_resposta(usuario_id, from_jid, texto, db)

            elif block.name == "update_lead_status":
                if lead:
                    nova_situacao = block.input.get("situacao", "contatado")
                    obs = block.input.get("observacoes")
                    _atualizar_lead(db, lead, nova_situacao, obs)
                    logger.info(
                        "WhatsApp agent: lead %s atualizado para '%s'", lead.id, nova_situacao
                    )
