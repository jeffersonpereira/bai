from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_agency():
    db = SessionLocal()
    existing = db.query(User).filter(User.email == "agency@teste.com").first()
    if not existing:
        user = User(
            email="agency@teste.com",
            hashed_password=get_password_hash("123456"),
            name="Agência Teste",
            role="agency",
            is_active=True
        )
        db.add(user)
        db.commit()
        print("Usuário agency@teste.com criado com sucesso!")
    else:
        print("Usuário agency@teste.com já existe.")
    db.close()

if __name__ == "__main__":
    create_agency()
