from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.favorito import Favorito
from app.models.imovel import Imovel
from app.models.usuario import Usuario
from app.schemas.favorito import FavoritoCriar, FavoritoResposta
from app.core.deps import get_current_user

router = APIRouter(prefix="/favoritos", tags=["favoritos"])


@router.get("/", response_model=List[FavoritoResposta])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return db.query(Favorito).filter(Favorito.usuario_id == current_user.id).all()


@router.post("/", response_model=FavoritoResposta)
def add_favorite(
    favorite_in: FavoritoCriar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not db.query(Imovel).filter(Imovel.id == favorite_in.imovel_id).first():
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    existing = db.query(Favorito).filter(
        Favorito.usuario_id == current_user.id,
        Favorito.imovel_id == favorite_in.imovel_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Imóvel já está nos favoritos")

    new_favorite = Favorito(usuario_id=current_user.id, imovel_id=favorite_in.imovel_id)
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    return new_favorite


@router.delete("/{imovel_id}")
def remove_favorite(
    imovel_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    favorite = db.query(Favorito).filter(
        Favorito.usuario_id == current_user.id,
        Favorito.imovel_id == imovel_id,
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorito não encontrado")

    db.delete(favorite)
    db.commit()
    return {"message": "Favorito removido"}
