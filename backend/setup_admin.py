import sys
import os

sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def main():
    db = SessionLocal()
    email = "admin@bai.com"
    pwd = "admin"
    
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        existing.role = "admin"
        db.commit()
    else:
        hashed = get_password_hash(pwd)
        user = User(
            email=email,
            hashed_password=hashed,
            name="Administrador BAI",
            role="admin",
            is_active=True
        )
        db.add(user)
        db.commit()
    
    print(f"Usuário Admin garantido: {email} (senha: {pwd})")
    db.close()

if __name__ == "__main__":
    main()
