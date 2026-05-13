from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.cupom import Cupom, TipoDesconto
from app.models.usuario import Usuario
from app.core.deps import get_current_admin, get_current_user

router = APIRouter(tags=["cupons"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class CupomCreate(BaseModel):
    codigo: str
    tipo_desconto: TipoDesconto = TipoDesconto.percentual
    valor_desconto: float
    valido_ate: Optional[datetime] = None
    usos_max: Optional[int] = None


class CupomUpdate(BaseModel):
    ativo: Optional[bool] = None
    valido_ate: Optional[datetime] = None
    usos_max: Optional[int] = None


class CupomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    tipo_desconto: TipoDesconto
    valor_desconto: float
    valido_ate: Optional[datetime]
    usos_max: Optional[int]
    usos_atual: int
    ativo: bool
    criado_em: datetime


class CupomValidacao(BaseModel):
    codigo: str


class CupomValidacaoResponse(BaseModel):
    valido: bool
    tipo_desconto: Optional[TipoDesconto] = None
    valor_desconto: Optional[float] = None
    mensagem: str


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.post("/admin/cupons", response_model=CupomResponse)
def criar_cupom(
    body: CupomCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    if db.query(Cupom).filter_by(codigo=body.codigo.upper()).first():
        raise HTTPException(status_code=400, detail="Código de cupom já existe.")
    cupom = Cupom(
        codigo=body.codigo.upper().strip(),
        tipo_desconto=body.tipo_desconto,
        valor_desconto=body.valor_desconto,
        valido_ate=body.valido_ate,
        usos_max=body.usos_max,
    )
    db.add(cupom)
    db.commit()
    db.refresh(cupom)
    return cupom


@router.get("/admin/cupons", response_model=List[CupomResponse])
def listar_cupons(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    return db.query(Cupom).order_by(Cupom.criado_em.desc()).all()


@router.patch("/admin/cupons/{cupom_id}", response_model=CupomResponse)
def atualizar_cupom(
    cupom_id: int,
    body: CupomUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_admin),
):
    cupom = db.query(Cupom).filter_by(id=cupom_id).first()
    if not cupom:
        raise HTTPException(status_code=404, detail="Cupom não encontrado.")
    if body.ativo is not None:
        cupom.ativo = body.ativo
    if body.valido_ate is not None:
        cupom.valido_ate = body.valido_ate
    if body.usos_max is not None:
        cupom.usos_max = body.usos_max
    db.commit()
    db.refresh(cupom)
    return cupom


# ── Public validation endpoint ─────────────────────────────────────────────────

@router.post("/cupons/validar", response_model=CupomValidacaoResponse)
def validar_cupom(
    body: CupomValidacao,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    cupom = db.query(Cupom).filter_by(codigo=body.codigo.upper().strip()).first()
    if not cupom or not cupom.ativo:
        return CupomValidacaoResponse(valido=False, mensagem="Cupom inválido ou inativo.")
    now = datetime.now(timezone.utc)
    if cupom.valido_ate and cupom.valido_ate < now:
        return CupomValidacaoResponse(valido=False, mensagem="Cupom expirado.")
    if cupom.usos_max is not None and cupom.usos_atual >= cupom.usos_max:
        return CupomValidacaoResponse(valido=False, mensagem="Cupom esgotado.")
    desc_label = (
        f"{cupom.valor_desconto:.0f}%"
        if cupom.tipo_desconto == TipoDesconto.percentual
        else f"R$ {cupom.valor_desconto:.2f}"
    )
    return CupomValidacaoResponse(
        valido=True,
        tipo_desconto=cupom.tipo_desconto,
        valor_desconto=cupom.valor_desconto,
        mensagem=f"Cupom válido! Desconto de {desc_label}.",
    )
