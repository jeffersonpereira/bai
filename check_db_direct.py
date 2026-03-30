import sys
import os
from sqlalchemy import create_engine, text

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

def check_db_direct():
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Query for columns in PostgreSQL
            query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'properties';
            """)
            result = conn.execute(query)
            columns = [row[0] for row in result]
            print(f"Columns in 'properties': {columns}")
            
            # Check if valor_aluguel is there
            if "valor_aluguel" in columns:
                print("valor_aluguel exists.")
            else:
                print("valor_aluguel does NOT exist.")
                
            # Check if state is there
            if "state" in columns:
                print("state exists.")
            else:
                print("state does NOT exist.")
    except Exception as e:
        print(f"Error checking DB: {e}")

if __name__ == "__main__":
    check_db_direct()
