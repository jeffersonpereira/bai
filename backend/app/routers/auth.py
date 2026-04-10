from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import jwt

from app.db.database import get_db
from app.models.user import User
from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.user import UserCreate, UserResponse, Token
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, user_in)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- Dependências de autenticação e autorização ---

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
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

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada")
    return user


def get_current_agency(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["agency", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a agências.")
    return current_user


def get_current_independent_broker(current_user: User = Depends(get_current_user)) -> User:
    if not (current_user.role == "broker" and current_user.parent_id is None) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a corretores independentes.")
    return current_user


def get_current_full_access(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role in ["admin", "agency"]:
        return current_user
    if current_user.role == "broker" and current_user.parent_id is None:
        return current_user
    raise HTTPException(status_code=403, detail="Acesso restrito a agências e corretores independentes.")


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return current_user


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
