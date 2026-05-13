from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.comissao import Comissao
from app.models.usuario import Usuario
from app.models.imovel import Imovel


def _assert_write_access(current_user: Usuario) -> None:
    if current_user.perfil not in ["imobiliaria", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a agências e administradores.")


def _assert_read_access(current_user: Usuario) -> None:
    if current_user.perfil not in ["imobiliaria", "admin", "corretor"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")


def list_comissoes(db: Session, current_user: Usuario, situacao: str | None = None) -> list:
    _assert_read_access(current_user)
    query = db.query(Comissao)

    if current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        query = query.filter(Comissao.corretor_id.in_(broker_ids))
    elif current_user.perfil == "corretor":
        query = query.filter(Comissao.corretor_id == current_user.id)

    if situacao:
        query = query.filter(Comissao.situacao_pagamento == situacao)

    return query.order_by(Comissao.criado_em.desc()).all()


def create_comissao(
    db: Session,
    imovel_id: int,
    corretor_id: int,
    percentual: float,
    proposta_id: int | None,
    observacoes: str | None,
    current_user: Usuario,
) -> Comissao:
    _assert_write_access(current_user)

    prop = db.query(Imovel).filter(Imovel.id == imovel_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    corretor = db.query(Usuario).filter(Usuario.id == corretor_id).first()
    if not corretor:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")

    valor_base = prop.preco
    valor_comissao = round(float(valor_base) * percentual / 100, 2)

    comissao = Comissao(
        proposta_id=proposta_id,
        imovel_id=imovel_id,
        corretor_id=corretor_id,
        imobiliaria_id=current_user.id if current_user.perfil == "imobiliaria" else None,
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
    current_user: Usuario,
) -> Comissao:
    _assert_write_access(current_user)
    valid = {"pendente", "pago", "cancelado"}
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status inválido. Permitidos: {valid}")

    comissao = db.query(Comissao).filter(Comissao.id == comissao_id).first()
    if not comissao:
        raise HTTPException(status_code=404, detail="Comissão não encontrada")

    comissao.situacao_pagamento = new_status
    if new_status == "pago":
        comissao.pago_em = datetime.now(timezone.utc)

    db.commit()
    db.refresh(comissao)
    return comissao


def get_resumo(db: Session, current_user: Usuario) -> dict:
    _assert_read_access(current_user)

    query = db.query(Comissao)
    if current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        query = query.filter(Comissao.corretor_id.in_(broker_ids))
    elif current_user.perfil == "corretor":
        query = query.filter(Comissao.corretor_id == current_user.id)

    all_comissoes = query.all()
    total_gerado = sum(float(c.valor_comissao) for c in all_comissoes)
    total_pago = sum(float(c.valor_comissao) for c in all_comissoes if c.situacao_pagamento == "pago")
    total_pendente = sum(float(c.valor_comissao) for c in all_comissoes if c.situacao_pagamento == "pendente")

    return {
        "total_comissoes": len(all_comissoes),
        "total_gerado": round(total_gerado, 2),
        "total_pago": round(total_pago, 2),
        "total_pendente": round(total_pendente, 2),
    }
