from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.planos import obter_limites, PRECOS_PLANO, LIMITES_PLANO
from app.models.usuario import Usuario
from app.models.imovel import Imovel
from app.models.lead import Lead
from app.models.documento import Documento
from app.models.pagamento import Pagamento


def obter_consumo(db: Session, usuario: Usuario) -> dict:
    imoveis_ativos = db.query(Imovel).filter(
        Imovel.corretor_id == usuario.id,
        Imovel.situacao == "ativo",
    ).count()

    leads_ativos = db.query(Lead).filter(
        Lead.corretor_id == usuario.id,
        Lead.situacao.notin_(["fechado", "perdido"]),
    ).count()

    documentos = db.query(Documento).filter(
        Documento.enviado_por == usuario.id,
        Documento.documento_origem_id.is_(None),
    ).count()

    storage_resultado = db.query(func.sum(Documento.tamanho_bytes)).filter(
        Documento.enviado_por == usuario.id,
        Documento.tamanho_bytes.isnot(None),
    ).scalar()
    storage_bytes = int(storage_resultado or 0)

    tipo_plano = usuario.tipo_plano or "gratuito"
    limites = obter_limites(tipo_plano)

    return {
        "tipo_plano": tipo_plano,
        "plano_expira_em": usuario.plano_expira_em.isoformat() if usuario.plano_expira_em else None,
        "limites": limites,
        "consumo": {
            "imoveis_ativos": imoveis_ativos,
            "leads_ativos": leads_ativos,
            "documentos": documentos,
            "storage_bytes_documentos": storage_bytes,
        },
    }


def listar_planos() -> list[dict]:
    return [
        {
            "chave": chave,
            "nome": PRECOS_PLANO[chave]["nome"],
            "preco_mensal": PRECOS_PLANO[chave]["mensal"],
            "preco_anual": PRECOS_PLANO[chave]["anual"],
            "limites": LIMITES_PLANO[chave],
        }
        for chave in ("gratuito", "pro", "premium")
    ]


def obter_assinatura(db: Session, usuario: Usuario) -> dict:
    tipo_plano = usuario.tipo_plano or "gratuito"
    preco = PRECOS_PLANO.get(tipo_plano, PRECOS_PLANO["gratuito"])

    ultimo_pag = (
        db.query(Pagamento)
        .filter(Pagamento.usuario_id == usuario.id, Pagamento.status == "aprovado")
        .order_by(Pagamento.criado_em.desc())
        .first()
    )

    return {
        "plano": tipo_plano,
        "ciclo": ultimo_pag.ciclo if ultimo_pag else None,
        "status": "ativo" if tipo_plano != "gratuito" else "gratuito",
        "valor_mensal": preco["mensal"],
        "proximo_vencimento": usuario.plano_expira_em.isoformat() if usuario.plano_expira_em else None,
        "gateway": ultimo_pag.gateway if ultimo_pag else None,
        "referencia_externa": ultimo_pag.referencia_externa if ultimo_pag else None,
    }
