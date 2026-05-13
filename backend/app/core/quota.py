from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.planos import obter_limites
from app.models.usuario import Usuario


def verificar_quota_imoveis(db: Session, usuario: Usuario) -> None:
    limites = obter_limites(usuario.tipo_plano)
    max_imoveis = limites["imoveis_ativos"]
    if max_imoveis is None:
        return

    from app.models.imovel import Imovel
    count = db.query(Imovel).filter(
        Imovel.corretor_id == usuario.id,
        Imovel.situacao == "ativo",
    ).count()

    if count >= max_imoveis:
        raise HTTPException(
            status_code=402,
            detail=f"Limite de {max_imoveis} imóveis ativos atingido no plano '{usuario.tipo_plano}'. Faça upgrade para publicar mais.",
        )


def verificar_quota_fotos(usuario: Usuario, n_fotos: int) -> None:
    limites = obter_limites(usuario.tipo_plano)
    max_fotos = limites["fotos_por_imovel"]
    if max_fotos is None:
        return

    if n_fotos > max_fotos:
        raise HTTPException(
            status_code=402,
            detail=f"Máximo de {max_fotos} fotos por imóvel no plano '{usuario.tipo_plano}'.",
        )


def verificar_quota_leads(db: Session, usuario: Usuario) -> None:
    limites = obter_limites(usuario.tipo_plano)
    max_leads = limites["leads_ativos"]
    if max_leads is None:
        return

    from app.models.lead import Lead
    count = db.query(Lead).filter(
        Lead.corretor_id == usuario.id,
        Lead.situacao.notin_(["fechado", "perdido"]),
    ).count()

    if count >= max_leads:
        raise HTTPException(
            status_code=402,
            detail=f"Limite de {max_leads} leads ativos atingido no plano '{usuario.tipo_plano}'. Faça upgrade para continuar.",
        )


def verificar_quota_documentos(db: Session, usuario: Usuario) -> None:
    limites = obter_limites(usuario.tipo_plano)
    max_docs = limites["documentos"]
    if max_docs is None:
        return

    from app.models.documento import Documento
    count = db.query(Documento).filter(
        Documento.enviado_por == usuario.id,
        Documento.documento_origem_id.is_(None),
    ).count()

    if count >= max_docs:
        raise HTTPException(
            status_code=402,
            detail=f"Limite de {max_docs} documentos atingido no plano '{usuario.tipo_plano}'. Faça upgrade para continuar.",
        )
