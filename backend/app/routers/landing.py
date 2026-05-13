from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import LandingConfigAtualizar, LandingConfigResposta, LandingPerfilPublico
from app.schemas.imovel import ImovelResposta
from app.services import landing_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/landing", tags=["landing"], redirect_slashes=False)


@router.get("/me", response_model=LandingConfigResposta)
def get_minha_landing(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return landing_service.get_landing_config(db, current_user)


@router.put("/me", response_model=LandingConfigResposta)
def atualizar_minha_landing(
    dados: LandingConfigAtualizar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return landing_service.atualizar_landing_config(db, current_user, dados)


@router.get("/me/slug-sugestao")
def sugerir_slug(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    sugestao = landing_service.sugerir_slug(db, current_user)
    return {"sugestao": sugestao}


@router.get("/slug-check")
def verificar_slug(
    slug: str = Query(..., min_length=3, max_length=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return landing_service.verificar_slug(db, slug, current_user.id)


@router.get("/{slug}")
def get_landing_publica(slug: str, db: Session = Depends(get_db)):
    resultado = landing_service.get_landing_por_slug(db, slug)
    usuario = resultado["usuario"]
    imoveis = resultado["imoveis"]

    perfil = LandingPerfilPublico.model_validate(usuario)

    imoveis_dados = []
    for im in imoveis:
        imovel_dict = {
            "id": im.id,
            "titulo": im.titulo,
            "preco": float(im.preco) if im.preco else 0,
            "valor_aluguel": float(im.valor_aluguel) if im.valor_aluguel else None,
            "area": float(im.area) if im.area else None,
            "quartos": im.quartos,
            "banheiros": im.banheiros,
            "vagas": im.vagas,
            "cidade": im.cidade,
            "bairro": im.bairro,
            "estado": im.estado,
            "tipo_oferta": im.tipo_oferta,
            "tipo_imovel": im.tipo_imovel,
            "url_imagem": im.url_imagem,
            "destaque": im.destaque,
            "total_visualizacoes": im.total_visualizacoes,
        }
        imoveis_dados.append(imovel_dict)

    return {
        "perfil": perfil,
        "imoveis": imoveis_dados,
        "total_imoveis": resultado["total_imoveis"],
    }
