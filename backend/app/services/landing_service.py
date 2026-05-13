import re
import unicodedata
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.usuario import Usuario
from app.models.imovel import Imovel
from app.schemas.usuario import LandingConfigAtualizar

PLANOS_COM_LANDING = {"pro", "premium"}


def _plano_valido(usuario: Usuario) -> bool:
    return (usuario.tipo_plano or "gratuito") in PLANOS_COM_LANDING


def _slugify(texto: str) -> str:
    normalizado = unicodedata.normalize("NFD", texto)
    ascii_str = "".join(c for c in normalizado if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", ascii_str.lower()).strip("-")


def get_landing_por_slug(db: Session, slug: str) -> dict:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.slug == slug, Usuario.ativo == True)
        .first()
    )
    if not usuario:
        raise HTTPException(status_code=404, detail="Landing page não encontrada")
    if not _plano_valido(usuario):
        raise HTTPException(status_code=404, detail="Landing page não encontrada")

    imoveis = (
        db.query(Imovel)
        .filter(Imovel.corretor_id == usuario.id, Imovel.situacao == "ativo")
        .order_by(Imovel.destaque.desc(), Imovel.criado_em.desc())
        .limit(50)
        .all()
    )

    return {
        "usuario": usuario,
        "imoveis": imoveis,
        "total_imoveis": len(imoveis),
    }


def get_landing_config(db: Session, usuario: Usuario) -> dict:
    landing_url = None
    if usuario.slug and _plano_valido(usuario):
        landing_url = f"/corretor/{usuario.slug}"
    return {
        "slug": usuario.slug,
        "bio": usuario.bio,
        "foto_perfil_url": usuario.foto_perfil_url,
        "cor_primaria": usuario.cor_primaria or "#1d4ed8",
        "cor_secundaria": usuario.cor_secundaria or "#1e293b",
        "redes_sociais": usuario.redes_sociais,
        "landing_ativa": usuario.landing_ativa or False,
        "tipo_plano": usuario.tipo_plano,
        "landing_url": landing_url,
    }


def atualizar_landing_config(db: Session, usuario: Usuario, dados: LandingConfigAtualizar) -> dict:
    if not _plano_valido(usuario):
        raise HTTPException(
            status_code=403,
            detail="Landing page disponível apenas para planos Pro e Premium.",
        )
    if dados.slug is not None and dados.slug != usuario.slug:
        existente = db.query(Usuario).filter(
            Usuario.slug == dados.slug, Usuario.id != usuario.id
        ).first()
        if existente:
            raise HTTPException(status_code=409, detail="Este slug já está em uso.")
        usuario.slug = dados.slug

    if dados.bio is not None:
        usuario.bio = dados.bio
    if dados.foto_perfil_url is not None:
        usuario.foto_perfil_url = dados.foto_perfil_url
    if dados.cor_primaria is not None:
        usuario.cor_primaria = dados.cor_primaria
    if dados.cor_secundaria is not None:
        usuario.cor_secundaria = dados.cor_secundaria
    if dados.redes_sociais is not None:
        usuario.redes_sociais = dados.redes_sociais.model_dump(exclude_none=True)
    if dados.landing_ativa is not None:
        if dados.landing_ativa and not usuario.slug:
            raise HTTPException(
                status_code=400,
                detail="Defina um slug antes de ativar a landing page.",
            )
        usuario.landing_ativa = dados.landing_ativa

    db.commit()
    db.refresh(usuario)
    return get_landing_config(db, usuario)


def verificar_slug(db: Session, slug: str, usuario_id: int) -> dict:
    if not re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$", slug):
        return {"disponivel": False, "motivo": "Slug inválido. Use apenas letras minúsculas, números e hífens."}
    existente = db.query(Usuario).filter(
        Usuario.slug == slug, Usuario.id != usuario_id
    ).first()
    if existente:
        return {"disponivel": False, "motivo": "Slug já está em uso por outro anunciante."}
    return {"disponivel": True, "motivo": None}


def sugerir_slug(db: Session, usuario: Usuario) -> str:
    base = _slugify(usuario.nome or f"usuario-{usuario.id}")
    candidato = base
    contador = 2
    while db.query(Usuario).filter(Usuario.slug == candidato, Usuario.id != usuario.id).first():
        candidato = f"{base}-{contador}"
        contador += 1
    return candidato
