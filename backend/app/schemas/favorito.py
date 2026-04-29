from pydantic import BaseModel, ConfigDict
from app.schemas.imovel import ImovelResposta


class FavoritoCriar(BaseModel):
    imovel_id: int


class FavoritoResposta(BaseModel):
    id: int
    imovel_id: int
    imovel: ImovelResposta

    model_config = ConfigDict(from_attributes=True)
