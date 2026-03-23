import sys
import os

# Adiciona o diretório atual ao path para encontrar o módulo 'app'
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def main():
    db = SessionLocal()
    email = "test@test.com"
    pwd = "123"
    
    # Limpa se já existir
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()
    
    hashed = get_password_hash(pwd)
    user = User(
        email=email,
        hashed_password=hashed,
        name="Corretor de Teste",
        role="broker"
    )
    db.add(user)
    db.commit()
    print(f"Usuário criado com sucesso: {email}")
    db.close()

if __name__ == "__main__":
    main()
