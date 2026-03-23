from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.user import User
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.config import settings
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    role: str | None = "user"

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email, 
        hashed_password=hashed_password, 
        name=user_in.name,
        role=user_in.role or "user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        import jwt
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_agency(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["agency", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a agências.")
    return current_user

def get_current_independent_broker(current_user: User = Depends(get_current_user)):
    if not (current_user.role == "broker" and current_user.parent_id is None) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a corretores independentes.")
    return current_user

def get_current_full_access(current_user: User = Depends(get_current_user)):
    if current_user.role in ["admin", "agency"]:
        return current_user
    if current_user.role == "broker" and current_user.parent_id is None:
        return current_user
    raise HTTPException(status_code=403, detail="Acesso restrito a agências e corretores independentes.")

class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    role: str
    phone: str | None = None
    creci: str | None = None
    parent_id: int | None = None

    class Config:
        from_attributes = True

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
