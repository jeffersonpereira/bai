from typing import Optional

# Limites por plano — None significa ilimitado
LIMITES_PLANO: dict[str, dict] = {
    "gratuito": {
        "imoveis_ativos": 2,
        "fotos_por_imovel": 4,
        "storage_bytes": 250 * 1024 * 1024,       # 250 MB
        "leads_ativos": 30,
        "documentos": 10,
        "assinatura_digital": False,
        "whatsapp": False,
        "landing_page": False,
        "corretores_equipe": 1,
        "relatorios": False,
        "matching": False,
    },
    "pro": {
        "imoveis_ativos": 25,
        "fotos_por_imovel": 5,
        "storage_bytes": 2 * 1024 * 1024 * 1024,  # 2 GB
        "leads_ativos": None,
        "documentos": 100,
        "assinatura_digital": False,
        "whatsapp": True,
        "landing_page": True,
        "corretores_equipe": 3,
        "relatorios": True,
        "matching": True,
    },
    "premium": {
        "imoveis_ativos": None,
        "fotos_por_imovel": None,
        "storage_bytes": 50 * 1024 * 1024 * 1024, # 50 GB
        "leads_ativos": None,
        "documentos": None,
        "assinatura_digital": True,
        "whatsapp": True,
        "landing_page": True,
        "corretores_equipe": 15,
        "relatorios": True,
        "matching": True,
    },
}

PRECOS_PLANO: dict[str, dict] = {
    "gratuito": {"mensal": 0.0, "anual": 0.0, "nome": "Gratuito"},
    "pro":      {"mensal": 97.0, "anual": 79.0, "nome": "Pro"},
    "premium":  {"mensal": 397.0, "anual": 317.0, "nome": "Premium"},
}


def obter_limites(tipo_plano: Optional[str]) -> dict:
    return LIMITES_PLANO.get(tipo_plano or "gratuito", LIMITES_PLANO["gratuito"])


def checar_feature(tipo_plano: Optional[str], feature: str) -> bool:
    return bool(obter_limites(tipo_plano).get(feature, False))
