from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.usuario import Usuario
from app.core.security import verify_password, get_password_hash
from app.schemas.usuario import UsuarioCriar


def get_user_by_email(db: Session, email: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def register_user(db: Session, user_in: UsuarioCriar) -> Usuario:
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    try:
        hashed_password = get_password_hash(user_in.password[:72])
    except ValueError:
        raise HTTPException(status_code=400, detail="Senha fornecida possui formato ou tamanho inválidos")

    new_user = Usuario(
        email=user_in.email,
        senha_hash=hashed_password,
        nome=user_in.nome,
        perfil=user_in.perfil or "comprador",
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> Usuario:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not user.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada")

    try:
        is_valid = verify_password(password[:72], user.senha_hash)
    except ValueError:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    if not is_valid:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    return user
