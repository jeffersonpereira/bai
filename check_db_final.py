import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load .env from backend
load_dotenv("backend/.env")

def check_db_final():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in environment.")
        return
        
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'properties';
            """)
            result = conn.execute(query)
            columns = [row[0] for row in result]
            print(f"Columns in 'properties': {columns}")
            
            if "valor_aluguel" in columns:
                print("SUCCESS: valor_aluguel exists.")
            else:
                print("FAILURE: valor_aluguel does NOT exist.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db_final()
