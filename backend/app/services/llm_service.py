import os
import httpx
from sqlalchemy.orm import Session
from app.models.lead import Lead

# Usa a API do OpenAI ou Gemini, aqui faremos um Mock avançado ou dependência
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")

async def generate_reply_for_lead(lead: Lead, user_message: str, db: Session) -> str:
    # 1. Recuperar contexto do histórico do Lead (WhatsAppMessage)
    # messages = db.query(WhatsAppMessage).filter(WhatsAppMessage.lead_id == lead.id).all()
    
    # 2. Construir o Prompt de Contexto
    system_prompt = (
        f"Você é um corretor virtual imobiliário focado em qualificar o cliente chamado {lead.name}. "
        "Sua função é descobrir qual tipo de imóvel ele busca e se ele tem interesse "
        "em agendar uma visita. Se o cliente demonstrar intenção de visita, sugira um horário e diga que "
        "agendou, extraindo {intenção: visita}."
    )
    
    # 3. Chamar "Modelo" Real
    # Se houver chave API, chame openai/gemini. Caso contrário, retorne resposta programática
    if not LLM_API_KEY:
        # Mock Response
        if "visita" in user_message.lower():
            return "Perfeito! Já registrei o interesse de visita. Nossa equipe confirmará o horário."
        elif "preço" in user_message.lower() or "valor" in user_message.lower():
            return "Temos imóveis que variam de acordo com o padrão. Qual sua faixa de orçamento?"
        else:
            return "Olá! Sou seu assistente de imóveis. Estou aqui para te ajudar a encontrar o lugar ideal. O que você procura hoje?"

    # LLM CALL (Placeholder)
    return "Resposta real da IA viria aqui via API externa."
