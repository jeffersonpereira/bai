import sys
import os

# Adiciona o diretório atual ao sys.path para permitir importações relativas
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.property import Property

db = SessionLocal()
try:
    properties = db.query(Property).order_by(Property.id.desc()).limit(10).all()

    if not properties:
        print("Nenhum imóvel encontrado no banco.")
    else:
        for p in properties:
            print(f"ID: {p.id} | Source: {p.source} | Image: {p.image_url[:100] if p.image_url else 'None'}")
finally:
    db.close()
