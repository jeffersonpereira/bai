from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.database import Base


class WhatsAppSession(Base):
    __tablename__ = "sessoes_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False, index=True)
    situacao = Column(String, default="desconectado")
    conectado_em = Column(DateTime(timezone=True), nullable=True)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WhatsAppMessage(Base):
    __tablename__ = "mensagens_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    jid_conversa = Column(String, nullable=False, index=True)
    id_mensagem = Column(String, nullable=True, unique=True)
    direcao = Column(String, nullable=False)
    conteudo = Column(Text, nullable=False)
    enviado_em = Column(DateTime(timezone=True), server_default=func.now())


class ContatoWhatsApp(Base):
    __tablename__ = "contatos_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    nome = Column(String(200), nullable=False)
    telefone = Column(String(50), nullable=False)
    email = Column(String(200), nullable=True)
    notas = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class RespostaRapida(Base):
    __tablename__ = "respostas_rapidas_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    atalho = Column(String(50), nullable=False)
    mensagem = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class TagWhatsApp(Base):
    __tablename__ = "tags_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    nome = Column(String(100), nullable=False)
    cor = Column(String(50), nullable=False, default="bg-emerald-500")
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class TagConversa(Base):
    __tablename__ = "tags_conversas_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey("tags_whatsapp.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    jid_conversa = Column(String(50), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class FilaWhatsApp(Base):
    __tablename__ = "filas_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    nome = Column(String(100), nullable=False)
    cor = Column(String(20), nullable=False, default="#10b981")
    saudacao = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class AgendamentoMensagem(Base):
    __tablename__ = "agendamentos_mensagens_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    destinatario = Column(String(50), nullable=False)
    mensagem = Column(Text, nullable=False)
    agendado_para = Column(DateTime(timezone=True), nullable=False)
    situacao = Column(String(20), nullable=False, default="pendente")  # pendente, enviado, cancelado, falhou
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class CampanhaWhatsApp(Base):
    __tablename__ = "campanhas_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    nome = Column(String(200), nullable=False)
    mensagem = Column(Text, nullable=False)
    situacao = Column(String(20), nullable=False, default="rascunho")  # rascunho, em_andamento, concluida, cancelada
    total_envios = Column(Integer, default=0)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class ListaContatos(Base):
    __tablename__ = "listas_contatos_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    nome = Column(String(200), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class ItemListaContatos(Base):
    __tablename__ = "itens_lista_contatos_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    lista_id = Column(Integer, ForeignKey("listas_contatos_whatsapp.id", ondelete="CASCADE"), nullable=False, index=True)
    nome = Column(String(200), nullable=True)
    telefone = Column(String(50), nullable=False)


class HorarioAtendimento(Base):
    __tablename__ = "horarios_atendimento_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    dia_semana = Column(Integer, nullable=False)  # 0=seg … 6=dom
    inicio = Column(String(5), nullable=False, default="08:00")
    fim = Column(String(5), nullable=False, default="18:00")
    ativo = Column(Boolean, nullable=False, default=True)


class ConfigWhatsApp(Base):
    __tablename__ = "config_whatsapp"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False, index=True)
    mensagem_fora_horario = Column(Text, nullable=True)
    intervalo_campanha_seg = Column(Integer, default=5)
    variacao_campanha_seg = Column(Integer, default=3)
