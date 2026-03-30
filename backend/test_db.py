from app.db.database import SessionLocal
from app.models.property import Property

print("Testing database connection and query (NO GUARDS)...")
db = SessionLocal()
results = db.query(Property).all()
print(f"Success! Found {len(results)} properties")
db.close()
