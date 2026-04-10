import os
import httpx
from sqlalchemy.orm import Session
from app.models.lead import Lead
import google.generativeai as genai

# Key fonecida
LLM_API_KEY = os.environ.get("LLM_API_KEY", "AIzaSyDIAUY_mJZCORHPkj_AbmVfCwM7dv6Ippg")
genai.configure(api_key=LLM_API_KEY)

async def generate_reply_for_lead(lead: Lead, user_message: str, db: Session) -> str:
    # 1. Recuperar contexto do histórico do Lead (Opcional, omitido por brevidade)
    
    # 2. Construir o Prompt de Contexto Mestre
    system_prompt = (
        f"Você é um corretor virtual imobiliário de alta performance chamado Assistente e focado em qualificar o cliente chamado {lead.name}. "
        "Siga estas regras restritas:\n"
        "1. Seja amigável, direto e extremamente conciso nas mensagens (estilo WhatsApp).\n"
        "2. Nunca invente imóveis que não conheça. Seu objetivo primário é coletar preferências.\n"
        "3. Descubra qual tipo de imóvel ele busca e pergunte se ele tem interesse em sugerir um horário de agendar uma visita.\n"
        "4. Se o cliente demonstrar intenção REA de visita após ser perguntado, confirme."
    )
    
    # 3. Request pro Gemini
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt,
        )
        response = model.generate_content(user_message)
        return response.text.strip()
    except Exception as e:
        print(f"Erro na IA Gemini: {e}")
        return "Nossa inteligência artificial está temporariamente offline, um corretor humano prosseguirá em instantes."

