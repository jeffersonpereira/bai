import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Carrega as variáveis do .env do backend
load_dotenv("d:/Sources/BAI/backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

def check_remote_db():
    print(f"Conectando ao banco de dados: {DATABASE_URL.split('@')[-1]}") # Esconde credenciais
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        tables = inspector.get_table_names()
        print(f"Tabelas encontradas: {tables}")
        
        if "appointments" in tables:
            columns = inspector.get_columns("appointments")
            print("\nColunas na tabela 'appointments':")
            for col in columns:
                print(f" - {col['name']} ({col['type']})")
        else:
            print("\nERRO: Tabela 'appointments' não encontrada no banco remoto!")
            
    except Exception as e:
        print(f"\nErro ao conectar ou inspecionar o banco: {e}")

if __name__ == "__main__":
    check_remote_db()
