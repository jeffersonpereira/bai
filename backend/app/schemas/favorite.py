from pydantic import BaseModel, ConfigDict
from app.schemas.property import PropertyResponse


class FavoriteCreate(BaseModel):
    property_id: int


class FavoriteResponse(BaseModel):
    id: int
    property_id: int
    property: PropertyResponse

    model_config = ConfigDict(from_attributes=True)
