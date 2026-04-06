from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.user import User
from app.core.security import verify_password, get_password_hash
from app.schemas.user import UserCreate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, user_in: UserCreate) -> User:
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    try:
        hashed_password = get_password_hash(user_in.password[:72])
    except ValueError:
        raise HTTPException(status_code=400, detail="Senha fornecida possui formato ou tamanho inválidos")
        
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        name=user_in.name,
        role=user_in.role or "user",
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada")
        
    try:
        is_valid = verify_password(password[:72], user.hashed_password)
    except ValueError:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
        
    if not is_valid:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    return user
