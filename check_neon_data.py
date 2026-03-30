import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("d:/Sources/BAI/backend/.env")
engine = create_engine(os.getenv("DATABASE_URL"))

def check_data():
    with engine.connect() as conn:
        # Check properties
        p_count = conn.execute(text("SELECT count(*) FROM properties")).scalar()
        print(f"Total de imóveis: {p_count}")
        
        if p_count > 0:
            first_p = conn.execute(text("SELECT id, title FROM properties LIMIT 1")).fetchone()
            print(f"Primeiro imóvel: ID={first_p[0]}, Titulo={first_p[1]}")
        
        # Check appointments
        a_count = conn.execute(text("SELECT count(*) FROM appointments")).scalar()
        print(f"Total de agendamentos realizados: {a_count}")
        
        if a_count > 0:
            last_a = conn.execute(text("SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1")).fetchone()
            print(f"Último agendamento: {last_a}")

if __name__ == "__main__":
    check_data()
