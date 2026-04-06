from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.comissao import Comissao
from app.models.user import User
from app.models.property import Property


def _assert_agency_access(current_user: User) -> None:
    if current_user.role not in ["agency", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a agências e administradores.")


def list_comissoes(db: Session, current_user: User, status: str | None = None) -> list:
    _assert_agency_access(current_user)
    query = db.query(Comissao)

    if current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        query = query.filter(Comissao.corretor_id.in_(broker_ids))

    if status:
        query = query.filter(Comissao.status_pagamento == status)

    return query.order_by(Comissao.created_at.desc()).all()


def create_comissao(
    db: Session,
    property_id: int,
    corretor_id: int,
    percentual: float,
    proposal_id: int | None,
    observacoes: str | None,
    current_user: User,
) -> Comissao:
    _assert_agency_access(current_user)

    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    corretor = db.query(User).filter(User.id == corretor_id).first()
    if not corretor:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")

    valor_base = prop.price
    valor_comissao = round(valor_base * percentual / 100, 2)

    comissao = Comissao(
        proposal_id=proposal_id,
        property_id=property_id,
        corretor_id=corretor_id,
        agency_id=current_user.id if current_user.role == "agency" else None,
        valor_imovel=valor_base,
        percentual=percentual,
        valor_comissao=valor_comissao,
        observacoes=observacoes,
    )
    db.add(comissao)
    db.commit()
    db.refresh(comissao)
    return comissao


def update_status(
    db: Session,
    comissao_id: int,
    new_status: str,
    current_user: User,
) -> Comissao:
    _assert_agency_access(current_user)
    valid = {"pendente", "pago", "cancelado"}
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status inválido. Permitidos: {valid}")

    comissao = db.query(Comissao).filter(Comissao.id == comissao_id).first()
    if not comissao:
        raise HTTPException(status_code=404, detail="Comissão não encontrada")

    from datetime import datetime, timezone
    comissao.status_pagamento = new_status
    if new_status == "pago":
        comissao.paid_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(comissao)
    return comissao


def get_resumo(db: Session, current_user: User) -> dict:
    """Resumo financeiro de comissões para o dashboard da agência."""
    _assert_agency_access(current_user)

    query = db.query(Comissao)
    if current_user.role == "agency":
        broker_ids = [b.id for b in current_user.brokers]
        broker_ids.append(current_user.id)
        query = query.filter(Comissao.corretor_id.in_(broker_ids))

    all_comissoes = query.all()
    total_gerado = sum(c.valor_comissao for c in all_comissoes)
    total_pago = sum(c.valor_comissao for c in all_comissoes if c.status_pagamento == "pago")
    total_pendente = sum(c.valor_comissao for c in all_comissoes if c.status_pagamento == "pendente")

    return {
        "total_comissoes": len(all_comissoes),
        "total_gerado": round(total_gerado, 2),
        "total_pago": round(total_pago, 2),
        "total_pendente": round(total_pendente, 2),
    }
