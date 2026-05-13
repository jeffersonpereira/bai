from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.configuracao import (
    GatewayConfigAtualizar,
    PlataformaConfigAtualizar,
    ConfiguracaoSistemaResposta,
    TesteGatewayResposta,
)
from app.services import configuracao_service
from app.core.deps import get_current_admin

router = APIRouter(prefix="/admin/configuracoes", tags=["admin-configuracoes"])


@router.get("/", response_model=ConfiguracaoSistemaResposta)
def get_configuracoes(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    return configuracao_service.obter_configuracoes(db)


@router.put("/gateway", response_model=ConfiguracaoSistemaResposta)
def update_gateway(
    dados: GatewayConfigAtualizar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    return configuracao_service.atualizar_gateway(db, dados)


@router.put("/plataforma", response_model=ConfiguracaoSistemaResposta)
def update_plataforma(
    dados: PlataformaConfigAtualizar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    return configuracao_service.atualizar_plataforma(db, dados)


@router.post("/gateway/testar", response_model=TesteGatewayResposta)
def testar_gateway(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    return configuracao_service.testar_gateway(db)
