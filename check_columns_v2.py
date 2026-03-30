import sys
import os
from sqlalchemy import create_engine, inspect

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

def check_columns():
    try:
        engine = create_engine(settings.DATABASE_URL)
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("properties")]
        print(f"Columns in 'properties': {columns}")
        
        tables = inspector.get_table_names()
        print(f"Other tables: {tables}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()
