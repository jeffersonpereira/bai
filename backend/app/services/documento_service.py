from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.documento import Documento
from app.models.imovel import Imovel
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoCriar, DocumentoAtualizar

VALID_TYPES = {
    # Imóvel
    "contrato", "escritura", "matricula", "certidao_onus", "habite_se",
    "iptu", "planta", "laudo", "rgi",
    # Proprietário
    "rg", "cpf", "cnh", "passaporte", "comprovante_renda",
    "declaracao_ir", "certidao_casamento", "procuracao",
    # Operacional
    "template", "material_marketing", "creci", "outros",
}
VALID_STATUSES = {"rascunho", "pendente_assinatura", "assinado", "arquivado"}
VALID_CONTEXTOS = {"imovel", "proprietario", "operacional"}
VALID_VISIBILIDADES = {"interno", "compartilhado", "publico"}


def _check_access(doc: Documento, current_user: Usuario):
    if current_user.perfil in ("admin", "imobiliaria", "corretor"):
        return
    if doc.enviado_por != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar este documento")


def _validate_fields(data: dict):
    if "tipo_documento" in data and data["tipo_documento"] not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Válidos: {sorted(VALID_TYPES)}")
    if "situacao" in data and data["situacao"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Válidos: {sorted(VALID_STATUSES)}")
    if "contexto" in data and data["contexto"] not in VALID_CONTEXTOS:
        raise HTTPException(status_code=400, detail=f"Contexto inválido. Válidos: {sorted(VALID_CONTEXTOS)}")
    if "visibilidade" in data and data["visibilidade"] not in VALID_VISIBILIDADES:
        raise HTTPException(status_code=400, detail=f"Visibilidade inválida. Válidos: {sorted(VALID_VISIBILIDADES)}")


def _with_total_versoes(doc: Documento) -> Documento:
    origem_id = doc.documento_origem_id or doc.id
    total = doc.versoes.count() + 1 if not doc.documento_origem_id else 0
    doc.total_versoes = total
    return doc


def create_document(db: Session, doc_in: DocumentoCriar, current_user: Usuario) -> Documento:
    data = doc_in.model_dump()
    _validate_fields(data)

    if data.get("imovel_id") and current_user.perfil not in ("admin", "imobiliaria"):
        prop = db.query(Imovel).filter(Imovel.id == data["imovel_id"]).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Imóvel não encontrado")
        if prop.corretor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Sem permissão: você não é o anunciante deste imóvel")

    # Deduplicação por hash
    if data.get("hash_sha256"):
        existing = db.query(Documento).filter(
            Documento.hash_sha256 == data["hash_sha256"],
            Documento.enviado_por == current_user.id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Arquivo duplicado: documento '{existing.titulo}' já possui este conteúdo",
            )

    doc = Documento(**data, enviado_por=current_user.id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    doc.total_versoes = 1
    return doc


def get_document(db: Session, doc_id: int, current_user: Usuario) -> Documento:
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)
    doc.total_versoes = doc.versoes.count() + 1
    return doc


def list_documents(
    db: Session,
    current_user: Usuario,
    skip: int,
    limit: int,
    tipo_documento: str | None,
    situacao: str | None,
    contexto: str | None,
    imovel_id: int | None,
    proprietario_id: int | None,
    proposta_id: int | None,
    tag: str | None,
) -> dict:
    query = db.query(Documento).filter(Documento.documento_origem_id.is_(None))

    if current_user.perfil not in ("admin", "imobiliaria"):
        query = query.filter(Documento.enviado_por == current_user.id)

    if tipo_documento:
        query = query.filter(Documento.tipo_documento == tipo_documento)
    if situacao:
        query = query.filter(Documento.situacao == situacao)
    if contexto:
        query = query.filter(Documento.contexto == contexto)
    if imovel_id:
        query = query.filter(Documento.imovel_id == imovel_id)
    if proprietario_id:
        query = query.filter(Documento.proprietario_id == proprietario_id)
    if proposta_id:
        query = query.filter(Documento.proposta_id == proposta_id)
    if tag:
        query = query.filter(Documento.tags.contains([tag]))

    total = query.count()
    items = query.order_by(Documento.criado_em.desc()).offset(skip).limit(limit).all()

    for doc in items:
        doc.total_versoes = doc.versoes.count() + 1

    return {"items": items, "total": total, "page": (skip // limit) + 1, "limit": limit}


def list_vencendo(db: Session, current_user: Usuario, dias: int) -> dict:
    limite = datetime.now(timezone.utc) + timedelta(days=dias)
    query = db.query(Documento).filter(
        Documento.validade_em.isnot(None),
        Documento.validade_em <= limite,
        Documento.situacao != "arquivado",
    )
    if current_user.perfil not in ("admin", "imobiliaria"):
        query = query.filter(Documento.enviado_por == current_user.id)

    items = query.order_by(Documento.validade_em.asc()).all()
    for doc in items:
        doc.total_versoes = doc.versoes.count() + 1
    return {"items": items, "total": len(items)}


def list_versoes(db: Session, doc_id: int, current_user: Usuario) -> list:
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)

    origem_id = doc.documento_origem_id or doc.id
    raiz = db.query(Documento).filter(Documento.id == origem_id).first()

    versoes = [raiz] + db.query(Documento).filter(
        Documento.documento_origem_id == origem_id,
    ).order_by(Documento.versao_numero.asc()).all()

    for v in versoes:
        v.total_versoes = len(versoes)
    return versoes


def create_nova_versao(
    db: Session, doc_id: int, doc_in: DocumentoCriar, current_user: Usuario
) -> Documento:
    original = db.query(Documento).filter(Documento.id == doc_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(original, current_user)

    origem_id = original.documento_origem_id or original.id
    ultima_versao = db.query(Documento).filter(
        (Documento.id == origem_id) | (Documento.documento_origem_id == origem_id)
    ).order_by(Documento.versao_numero.desc()).first()
    proximo_numero = (ultima_versao.versao_numero if ultima_versao else 1) + 1

    data = doc_in.model_dump()
    _validate_fields(data)

    nova = Documento(
        **data,
        enviado_por=current_user.id,
        documento_origem_id=origem_id,
        versao_numero=proximo_numero,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    nova.total_versoes = proximo_numero
    return nova


def update_document(
    db: Session, doc_id: int, doc_in: DocumentoAtualizar, current_user: Usuario
) -> Documento:
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)

    updates = doc_in.model_dump(exclude_unset=True)
    _validate_fields(updates)

    for field, value in updates.items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    doc.total_versoes = doc.versoes.count() + 1
    return doc


def delete_document(db: Session, doc_id: int, current_user: Usuario) -> None:
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    _check_access(doc, current_user)
    db.delete(doc)
    db.commit()
