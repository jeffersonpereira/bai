from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.usuario import Usuario
from app.core.security import get_password_hash
from app.schemas.usuario import BrokerCreate


def add_broker(db: Session, broker_in: BrokerCreate, agency: Usuario) -> Usuario:
    if db.query(Usuario).filter(Usuario.email == broker_in.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    new_broker = Usuario(
        email=broker_in.email,
        senha_hash=get_password_hash(broker_in.password),
        nome=broker_in.nome,
        perfil="corretor",
        telefone=broker_in.telefone,
        creci=broker_in.creci,
        imobiliaria_id=agency.id,
    )
    db.add(new_broker)
    db.commit()
    db.refresh(new_broker)
    return new_broker


def list_brokers(db: Session, agency: Usuario) -> list[Usuario]:
    return db.query(Usuario).filter(Usuario.imobiliaria_id == agency.id).all()
