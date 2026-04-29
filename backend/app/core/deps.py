from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from app.db.database import get_db
from app.models.usuario import Usuario
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada")
    return user


async def get_optional_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme_optional),
) -> Usuario | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            return None
        user = db.query(Usuario).filter(Usuario.id == user_id_int).first()
        return user if user and user.ativo else None
    except jwt.PyJWTError:
        return None


def get_current_agency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.perfil not in ["imobiliaria", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a agências.")
    return current_user


def get_current_independent_broker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if not (current_user.perfil == "corretor" and current_user.imobiliaria_id is None) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a corretores independentes.")
    return current_user


def get_current_full_access(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.perfil in ["admin", "imobiliaria"]:
        return current_user
    if current_user.perfil == "corretor" and current_user.imobiliaria_id is None:
        return current_user
    raise HTTPException(status_code=403, detail="Acesso restrito a agências e corretores independentes.")


def get_current_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return current_user
