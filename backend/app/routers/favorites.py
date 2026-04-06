from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.favorite import Favorite
from app.models.property import Property
from app.models.user import User
from .auth import get_current_user
from pydantic import BaseModel
from .properties import PropertyResponse

router = APIRouter(prefix="/favorites", tags=["favorites"])

class FavoriteCreate(BaseModel):
    property_id: int

class FavoriteResponse(BaseModel):
    id: int
    property_id: int
    property: PropertyResponse

    class Config:
        from_attributes = True

@router.get("/", response_model=List[FavoriteResponse])
def get_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    favorites = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    return favorites

@router.post("/", response_model=FavoriteResponse)
def add_favorite(favorite_in: FavoriteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_property = db.query(Property).filter(Property.id == favorite_in.property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    existing_favorite = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.property_id == favorite_in.property_id).first()
    if existing_favorite:
        raise HTTPException(status_code=400, detail="Imóvel já está nos favoritos")

    new_favorite = Favorite(user_id=current_user.id, property_id=favorite_in.property_id)
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    return new_favorite

@router.delete("/{property_id}")
def remove_favorite(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    favorite = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.property_id == property_id).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorito não encontrado")
    
    db.delete(favorite)
    db.commit()
    return {"message": "Favorito removido"}
