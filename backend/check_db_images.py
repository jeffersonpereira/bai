from app.db.database import SessionLocal
from app.models.property import Property

db = SessionLocal()
properties = db.query(Property).limit(10).all()

for p in properties:
    print(f"ID: {p.id} | Title: {p.title[:30]}... | Image URL: {p.image_url}")

db.close()
