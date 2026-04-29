from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class MidiaImovel(Base):
    __tablename__ = "midias_imovel"

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), nullable=False)
    tipo_midia = Column(String)  # imagem, video, tour_virtual
    url = Column(String)
    ordem = Column(Integer, default=0)

    imovel = relationship("Imovel", back_populates="midias")
