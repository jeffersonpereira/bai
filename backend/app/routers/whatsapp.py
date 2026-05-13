import asyncio
from fastapi import APIRouter, Depends, HTTPException, Header, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
import httpx

from app.db.database import get_db
from app.models.usuario import Usuario
from app.models.whatsapp import (
    WhatsAppSession, WhatsAppMessage,
    ContatoWhatsApp, RespostaRapida, TagWhatsApp, TagConversa,
    FilaWhatsApp, AgendamentoMensagem, CampanhaWhatsApp,
    ListaContatos, ItemListaContatos, HorarioAtendimento, ConfigWhatsApp,
)
from app.schemas.whatsapp import (
    WhatsAppSessionStatus, WhatsAppSendRequest, WhatsAppMessageResponse,
    WhatsAppWebhookMessage, WhatsAppWebhookStatus,
    ContatoCreate, ContatoUpdate, ContatoResponse,
    RespostaRapidaCreate, RespostaRapidaUpdate, RespostaRapidaResponse,
    TagCreate, TagUpdate, TagResponse, TagConversaCreate,
    FilaCreate, FilaUpdate, FilaResponse,
    AgendamentoCreate, AgendamentoResponse,
    CampanhaCreate, CampanhaUpdate, CampanhaResponse,
    ListaContatosCreate, ListaContatosResponse, ItemListaCreate, ItemListaResponse,
    HorarioCreate, HorarioResponse, ConfigUpdate, ConfigResponse,
)
from app.core.config import settings
from app.core.deps import get_current_user
from app.core.planos import checar_feature
from app.services.crm_service import criar_lead_auto
from app.agents.whatsapp_agent import handle_incoming_message

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

ALLOWED_ROLES = {"comprador", "corretor", "imobiliaria", "admin"}


def _node(path: str) -> str:
    return f"{settings.WHATSAPP_NODE_URL}{path}"


def _headers() -> dict:
    return {"X-Internal-Key": settings.WHATSAPP_INTERNAL_KEY}


def _check_role(user: Usuario) -> None:
    if user.perfil not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Perfil não autorizado para WhatsApp")
    if not checar_feature(user.tipo_plano, "whatsapp"):
        raise HTTPException(
            status_code=402,
            detail="WhatsApp disponível nos planos Pro e Premium. Faça upgrade para acessar.",
        )


# ── Session ────────────────────────────────────────────────────────────────────

@router.post("/session/start", response_model=WhatsAppSessionStatus)
async def start_session(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(_node(f"/sessions/{current_user.id}/start"), headers=_headers())
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Erro ao iniciar sessão WhatsApp")
    data = resp.json()
    return {"status": data.get("status", "connecting"), "qr": None}


@router.get("/session/status", response_model=WhatsAppSessionStatus)
async def session_status(current_user: Usuario = Depends(get_current_user)):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            resp = await client.get(_node(f"/sessions/{current_user.id}/status"), headers=_headers())
            if resp.status_code == 200:
                return resp.json()
        except httpx.RequestError:
            pass
    return {"status": "disconnected", "qr": None}


@router.delete("/session")
async def stop_session(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.delete(_node(f"/sessions/{current_user.id}"), headers=_headers())
        except httpx.RequestError:
            pass
    db.query(WhatsAppSession).filter_by(usuario_id=current_user.id).delete()
    db.commit()
    return {"ok": True}


# ── Messaging ──────────────────────────────────────────────────────────────────

@router.post("/send")
async def send_message(
    payload: WhatsAppSendRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            _node(f"/sessions/{current_user.id}/send"),
            headers=_headers(),
            json={"to": payload.to, "text": payload.text},
        )
    if resp.status_code != 200:
        detail = resp.json().get("error", "Falha ao enviar mensagem")
        raise HTTPException(status_code=400, detail=detail)

    jid = resp.json().get("jid", payload.to)
    msg = WhatsAppMessage(usuario_id=current_user.id, jid_conversa=jid, direcao="saida", conteudo=payload.text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/messages", response_model=List[WhatsAppMessageResponse])
def list_messages(
    chat_jid: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    q = db.query(WhatsAppMessage).filter(WhatsAppMessage.usuario_id == current_user.id)
    if chat_jid:
        q = q.filter(WhatsAppMessage.jid_conversa == chat_jid)
    return q.order_by(WhatsAppMessage.enviado_em.desc()).limit(limit).all()


# ── Internal webhooks ──────────────────────────────────────────────────────────

def _verify_internal(x_internal_key: Optional[str] = Header(None)) -> None:
    if x_internal_key != settings.WHATSAPP_INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/webhook/message", include_in_schema=False)
async def webhook_message(
    payload: WhatsAppWebhookMessage,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_internal),
):
    if payload.message_id:
        if db.query(WhatsAppMessage).filter_by(id_mensagem=payload.message_id).first():
            return {"ok": True, "duplicate": True}

    ts = (
        datetime.fromtimestamp(payload.timestamp, tz=timezone.utc)
        if payload.timestamp
        else None
    )
    msg = WhatsAppMessage(
        usuario_id=payload.user_id,
        jid_conversa=payload.from_jid,
        id_mensagem=payload.message_id,
        direcao="entrada",
        conteudo=payload.body,
        enviado_em=ts,
    )
    db.add(msg)
    db.commit()

    telefone = payload.from_jid.split("@")[0]
    mensagens_anteriores = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.usuario_id == payload.user_id,
        WhatsAppMessage.jid_conversa == payload.from_jid,
        WhatsAppMessage.direcao == "entrada",
        WhatsAppMessage.id != msg.id,
    ).first()
    if not mensagens_anteriores:
        criar_lead_auto(
            db,
            imovel_id=None,
            corretor_id=payload.user_id,
            nome=payload.push_name or telefone,
            telefone=telefone,
            origem="whatsapp",
            observacoes=f"Primeira mensagem: {payload.body[:300]}",
        )

    background_tasks.add_task(
        _run_agent,
        db,
        payload.user_id,
        payload.from_jid,
        payload.push_name,
    )

    return {"ok": True}


def _run_agent(db: Session, usuario_id: int, from_jid: str, push_name: Optional[str]) -> None:
    asyncio.run(handle_incoming_message(db, usuario_id, from_jid, push_name))


@router.post("/webhook/status", include_in_schema=False)
def webhook_status(
    payload: WhatsAppWebhookStatus,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_internal),
):
    session = db.query(WhatsAppSession).filter_by(usuario_id=payload.user_id).first()
    if not session:
        session = WhatsAppSession(usuario_id=payload.user_id)
        db.add(session)
    session.situacao = payload.status
    if payload.status == "connected":
        session.conectado_em = datetime.now(tz=timezone.utc)
    db.commit()
    return {"ok": True}


# ── Contatos ───────────────────────────────────────────────────────────────────

@router.get("/contatos", response_model=List[ContatoResponse])
def listar_contatos(
    busca: Optional[str] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    q = db.query(ContatoWhatsApp).filter(ContatoWhatsApp.usuario_id == current_user.id)
    if busca:
        like = f"%{busca}%"
        q = q.filter(
            (ContatoWhatsApp.nome.ilike(like)) | (ContatoWhatsApp.telefone.ilike(like))
        )
    return q.order_by(ContatoWhatsApp.nome).all()


@router.post("/contatos", response_model=ContatoResponse, status_code=201)
def criar_contato(
    payload: ContatoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    contato = ContatoWhatsApp(usuario_id=current_user.id, **payload.model_dump())
    db.add(contato)
    db.commit()
    db.refresh(contato)
    return contato


@router.put("/contatos/{contato_id}", response_model=ContatoResponse)
def atualizar_contato(
    contato_id: int,
    payload: ContatoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    contato = db.query(ContatoWhatsApp).filter_by(id=contato_id, usuario_id=current_user.id).first()
    if not contato:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(contato, k, v)
    db.commit()
    db.refresh(contato)
    return contato


@router.delete("/contatos/{contato_id}")
def deletar_contato(
    contato_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    contato = db.query(ContatoWhatsApp).filter_by(id=contato_id, usuario_id=current_user.id).first()
    if not contato:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    db.delete(contato)
    db.commit()
    return {"ok": True}


# ── Respostas Rápidas ──────────────────────────────────────────────────────────

@router.get("/respostas-rapidas", response_model=List[RespostaRapidaResponse])
def listar_respostas(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    return db.query(RespostaRapida).filter_by(usuario_id=current_user.id).order_by(RespostaRapida.atalho).all()


@router.post("/respostas-rapidas", response_model=RespostaRapidaResponse, status_code=201)
def criar_resposta(
    payload: RespostaRapidaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    rr = RespostaRapida(usuario_id=current_user.id, **payload.model_dump())
    db.add(rr)
    db.commit()
    db.refresh(rr)
    return rr


@router.put("/respostas-rapidas/{rr_id}", response_model=RespostaRapidaResponse)
def atualizar_resposta(
    rr_id: int,
    payload: RespostaRapidaUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    rr = db.query(RespostaRapida).filter_by(id=rr_id, usuario_id=current_user.id).first()
    if not rr:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(rr, k, v)
    db.commit()
    db.refresh(rr)
    return rr


@router.delete("/respostas-rapidas/{rr_id}")
def deletar_resposta(
    rr_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    rr = db.query(RespostaRapida).filter_by(id=rr_id, usuario_id=current_user.id).first()
    if not rr:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    db.delete(rr)
    db.commit()
    return {"ok": True}


# ── Tags ───────────────────────────────────────────────────────────────────────

@router.get("/tags", response_model=List[TagResponse])
def listar_tags(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    return db.query(TagWhatsApp).filter_by(usuario_id=current_user.id).order_by(TagWhatsApp.nome).all()


@router.post("/tags", response_model=TagResponse, status_code=201)
def criar_tag(
    payload: TagCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    tag = TagWhatsApp(usuario_id=current_user.id, **payload.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/tags/{tag_id}", response_model=TagResponse)
def atualizar_tag(
    tag_id: int,
    payload: TagUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    tag = db.query(TagWhatsApp).filter_by(id=tag_id, usuario_id=current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(tag, k, v)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}")
def deletar_tag(
    tag_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    tag = db.query(TagWhatsApp).filter_by(id=tag_id, usuario_id=current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada")
    db.query(TagConversa).filter_by(tag_id=tag_id).delete()
    db.delete(tag)
    db.commit()
    return {"ok": True}


@router.post("/tags/{tag_id}/conversas")
def adicionar_tag_conversa(
    tag_id: int,
    payload: TagConversaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    tag = db.query(TagWhatsApp).filter_by(id=tag_id, usuario_id=current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada")
    existing = db.query(TagConversa).filter_by(tag_id=tag_id, usuario_id=current_user.id, jid_conversa=payload.jid_conversa).first()
    if not existing:
        db.add(TagConversa(tag_id=tag_id, usuario_id=current_user.id, jid_conversa=payload.jid_conversa))
        db.commit()
    return {"ok": True}


@router.delete("/tags/{tag_id}/conversas/{jid}")
def remover_tag_conversa(
    tag_id: int,
    jid: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    db.query(TagConversa).filter_by(tag_id=tag_id, usuario_id=current_user.id, jid_conversa=jid).delete()
    db.commit()
    return {"ok": True}


# ── Filas ──────────────────────────────────────────────────────────────────────

@router.get("/filas", response_model=List[FilaResponse])
def listar_filas(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    return db.query(FilaWhatsApp).filter_by(usuario_id=current_user.id).order_by(FilaWhatsApp.nome).all()


@router.post("/filas", response_model=FilaResponse, status_code=201)
def criar_fila(
    payload: FilaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    fila = FilaWhatsApp(usuario_id=current_user.id, **payload.model_dump())
    db.add(fila)
    db.commit()
    db.refresh(fila)
    return fila


@router.put("/filas/{fila_id}", response_model=FilaResponse)
def atualizar_fila(
    fila_id: int,
    payload: FilaUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    fila = db.query(FilaWhatsApp).filter_by(id=fila_id, usuario_id=current_user.id).first()
    if not fila:
        raise HTTPException(status_code=404, detail="Fila não encontrada")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(fila, k, v)
    db.commit()
    db.refresh(fila)
    return fila


@router.delete("/filas/{fila_id}")
def deletar_fila(
    fila_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    fila = db.query(FilaWhatsApp).filter_by(id=fila_id, usuario_id=current_user.id).first()
    if not fila:
        raise HTTPException(status_code=404, detail="Fila não encontrada")
    db.delete(fila)
    db.commit()
    return {"ok": True}


# ── Agendamentos ───────────────────────────────────────────────────────────────

@router.get("/agendamentos", response_model=List[AgendamentoResponse])
def listar_agendamentos(
    situacao: Optional[str] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    q = db.query(AgendamentoMensagem).filter_by(usuario_id=current_user.id)
    if situacao:
        q = q.filter(AgendamentoMensagem.situacao == situacao)
    return q.order_by(AgendamentoMensagem.agendado_para).all()


@router.post("/agendamentos", response_model=AgendamentoResponse, status_code=201)
def criar_agendamento(
    payload: AgendamentoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    ag = AgendamentoMensagem(usuario_id=current_user.id, **payload.model_dump())
    db.add(ag)
    db.commit()
    db.refresh(ag)
    return ag


@router.delete("/agendamentos/{ag_id}")
def cancelar_agendamento(
    ag_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    ag = db.query(AgendamentoMensagem).filter_by(id=ag_id, usuario_id=current_user.id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    ag.situacao = "cancelado"
    db.commit()
    return {"ok": True}


# ── Campanhas ──────────────────────────────────────────────────────────────────

@router.get("/campanhas", response_model=List[CampanhaResponse])
def listar_campanhas(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    return db.query(CampanhaWhatsApp).filter_by(usuario_id=current_user.id).order_by(CampanhaWhatsApp.criado_em.desc()).all()


@router.post("/campanhas", response_model=CampanhaResponse, status_code=201)
def criar_campanha(
    payload: CampanhaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    camp = CampanhaWhatsApp(usuario_id=current_user.id, **payload.model_dump())
    db.add(camp)
    db.commit()
    db.refresh(camp)
    return camp


@router.put("/campanhas/{camp_id}", response_model=CampanhaResponse)
def atualizar_campanha(
    camp_id: int,
    payload: CampanhaUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    camp = db.query(CampanhaWhatsApp).filter_by(id=camp_id, usuario_id=current_user.id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(camp, k, v)
    db.commit()
    db.refresh(camp)
    return camp


@router.delete("/campanhas/{camp_id}")
def deletar_campanha(
    camp_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    camp = db.query(CampanhaWhatsApp).filter_by(id=camp_id, usuario_id=current_user.id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    db.delete(camp)
    db.commit()
    return {"ok": True}


# ── Listas de Contatos ─────────────────────────────────────────────────────────

@router.get("/listas-contatos", response_model=List[ListaContatosResponse])
def listar_listas(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    listas = db.query(ListaContatos).filter_by(usuario_id=current_user.id).order_by(ListaContatos.nome).all()
    result = []
    for l in listas:
        total = db.query(ItemListaContatos).filter_by(lista_id=l.id).count()
        result.append(ListaContatosResponse(id=l.id, nome=l.nome, criado_em=l.criado_em, total=total))
    return result


@router.post("/listas-contatos", response_model=ListaContatosResponse, status_code=201)
def criar_lista(
    payload: ListaContatosCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    lista = ListaContatos(usuario_id=current_user.id, **payload.model_dump())
    db.add(lista)
    db.commit()
    db.refresh(lista)
    return ListaContatosResponse(id=lista.id, nome=lista.nome, criado_em=lista.criado_em, total=0)


@router.delete("/listas-contatos/{lista_id}")
def deletar_lista(
    lista_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    lista = db.query(ListaContatos).filter_by(id=lista_id, usuario_id=current_user.id).first()
    if not lista:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    db.query(ItemListaContatos).filter_by(lista_id=lista_id).delete()
    db.delete(lista)
    db.commit()
    return {"ok": True}


@router.get("/listas-contatos/{lista_id}/itens", response_model=List[ItemListaResponse])
def listar_itens_lista(
    lista_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    lista = db.query(ListaContatos).filter_by(id=lista_id, usuario_id=current_user.id).first()
    if not lista:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    return db.query(ItemListaContatos).filter_by(lista_id=lista_id).all()


@router.post("/listas-contatos/{lista_id}/itens", response_model=ItemListaResponse, status_code=201)
def adicionar_item_lista(
    lista_id: int,
    payload: ItemListaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    lista = db.query(ListaContatos).filter_by(id=lista_id, usuario_id=current_user.id).first()
    if not lista:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    item = ItemListaContatos(lista_id=lista_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/listas-contatos/{lista_id}/itens/{item_id}")
def remover_item_lista(
    lista_id: int,
    item_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    lista = db.query(ListaContatos).filter_by(id=lista_id, usuario_id=current_user.id).first()
    if not lista:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    item = db.query(ItemListaContatos).filter_by(id=item_id, lista_id=lista_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}


# ── Horários de Atendimento ────────────────────────────────────────────────────

@router.get("/horarios", response_model=List[HorarioResponse])
def listar_horarios(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    horarios = db.query(HorarioAtendimento).filter_by(usuario_id=current_user.id).order_by(HorarioAtendimento.dia_semana).all()
    if not horarios:
        # Return defaults (Mon-Fri active, Sat-Sun inactive)
        defaults = []
        for dia in range(7):
            defaults.append(HorarioResponse(id=0, dia_semana=dia, inicio="08:00", fim="18:00", ativo=dia < 5))
        return defaults
    return horarios


@router.put("/horarios")
def salvar_horarios(
    horarios: List[HorarioCreate],
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    db.query(HorarioAtendimento).filter_by(usuario_id=current_user.id).delete()
    for h in horarios:
        db.add(HorarioAtendimento(usuario_id=current_user.id, **h.model_dump()))
    db.commit()
    return {"ok": True}


# ── Configurações WhatsApp ─────────────────────────────────────────────────────

@router.get("/config", response_model=ConfigResponse)
def obter_config(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    cfg = db.query(ConfigWhatsApp).filter_by(usuario_id=current_user.id).first()
    if not cfg:
        return ConfigResponse()
    return cfg


@router.put("/config", response_model=ConfigResponse)
def salvar_config(
    payload: ConfigUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_role(current_user)
    cfg = db.query(ConfigWhatsApp).filter_by(usuario_id=current_user.id).first()
    if not cfg:
        cfg = ConfigWhatsApp(usuario_id=current_user.id)
        db.add(cfg)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(cfg, k, v)
    db.commit()
    db.refresh(cfg)
    return cfg
