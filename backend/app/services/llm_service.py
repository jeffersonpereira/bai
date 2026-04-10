import logging
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.models.whatsapp_message import WhatsAppMessage
from app.core.config import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Máximo de turnos de histórico enviados ao LLM (mantém o contexto sem explodir tokens)
HISTORY_LIMIT = 20

# Gatilhos textuais para transições automáticas de status do Lead
_STATUS_TRIGGERS = {
    "contatado": ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "tudo bem", "quero saber"],
    "visita": [
        "quero visitar", "quero agendar", "vamos marcar", "podemos marcar", "quando posso ver",
        "visita", "agendar visita", "marcar visita", "quando tem horário", "quando tem hora",
    ],
    "proposta": [
        "tenho interesse", "quero comprar", "quero alugar", "quanto custa", "qual o valor",
        "faço uma proposta", "vou fazer proposta",
    ],
}

# Ordem de progressão do pipeline (nunca retroage)
_STATUS_ORDER = ["novo", "contatado", "visita", "proposta", "fechado", "perdido"]


def _detect_status_transition(message: str, current_status: str) -> str | None:
    """Retorna o novo status se a mensagem disparar uma transição avançada no pipeline."""
    msg_lower = message.lower()
    current_index = _STATUS_ORDER.index(current_status) if current_status in _STATUS_ORDER else 0

    best_new_status = None
    best_index = current_index

    for status, keywords in _STATUS_TRIGGERS.items():
        if status not in _STATUS_ORDER:
            continue
        target_index = _STATUS_ORDER.index(status)
        if target_index > best_index and any(kw in msg_lower for kw in keywords):
            best_new_status = status
            best_index = target_index

    return best_new_status


def _build_system_prompt(lead: Lead) -> str:
    status_context = {
        "novo": "Este é o primeiro contato. Apresente-se brevemente e descubra o que o cliente busca.",
        "contatado": "Já houve contato inicial. Aprofunde as preferências do cliente (tipo, localização, faixa de preço).",
        "visita": "O cliente demonstrou interesse em visitar. Confirme ou agende o horário.",
        "proposta": "O cliente tem intenção de compra/aluguel. Oriente sobre próximos passos e conecte com um corretor.",
        "fechado": "Negócio encerrado com sucesso. Seja cordial e pergunte se precisa de algo mais.",
        "perdido": "Lead desistiu. Seja gentil e deixe a porta aberta para futuro contato.",
    }

    stage_guidance = status_context.get(lead.status or "novo", status_context["novo"])

    name_part = (
        f"o cliente se chama {lead.name}" if lead.name and lead.name != lead.phone
        else "o nome do cliente ainda não foi coletado — pergunte o nome dele de forma natural na primeira oportunidade"
    )

    return (
        f"Você é um corretor virtual imobiliário chamado Lía, representando a imobiliária BAI.\n"
        f"O cliente ({name_part}) está no estágio '{lead.status or 'novo'}' do pipeline.\n\n"
        f"Orientação para este estágio: {stage_guidance}\n\n"
        "Regras de comportamento:\n"
        "1. Seja amigável, direto e extremamente conciso — estilo WhatsApp, sem parágrafos longos.\n"
        "2. Nunca invente imóveis ou informações que não conhece. Seu objetivo é coletar preferências e qualificar o lead.\n"
        "3. Faça no máximo UMA pergunta por mensagem para não sobrecarregar o cliente.\n"
        "4. Nunca repita informações que o cliente já forneceu na conversa.\n"
        "5. Se o cliente pedir algo fora do escopo imobiliário, redirecione gentilmente.\n"
        "6. Quando o cliente confirmar interesse real em visita, parabenize e diga que um corretor entrará em contato para confirmar."
    )


def _format_history(messages: list[WhatsAppMessage]) -> list[dict]:
    """Converte mensagens do banco em formato de conteúdo para o Gemini."""
    history = []
    for msg in messages:
        role = "user" if msg.direction == "inbound" else "model"
        history.append({"role": role, "parts": [{"text": msg.body}]})
    return history


async def generate_reply_for_lead(lead: Lead, user_message: str, db: Session) -> str:
    # Configura o cliente com a chave do settings (nunca hardcoded)
    genai.configure(api_key=settings.LLM_API_KEY)

    # Busca histórico das últimas HISTORY_LIMIT mensagens (excluindo a atual, que ainda não foi salva)
    history_rows = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.lead_id == lead.id)
        .order_by(WhatsAppMessage.timestamp.asc())
        .limit(HISTORY_LIMIT)
        .all()
    )

    system_prompt = _build_system_prompt(lead)
    history = _format_history(history_rows)

    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt,
        )
        chat = model.start_chat(history=history)
        response = chat.send_message(user_message)
        return response.text.strip()
    except Exception as e:
        logger.error("Erro na API Gemini para lead_id=%s: %s", lead.id, e)
        return "Nossa IA está temporariamente indisponível. Um corretor humano continuará o atendimento em breve."
