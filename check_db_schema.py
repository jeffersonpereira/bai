import sys
import os
from sqlalchemy import create_engine, inspect

# Use standard path for backend
sys.path.append(os.path.abspath("backend"))

from backend.app.core.config import settings

def check_db():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    tables = inspector.get_table_names()
    print(f"Tables: {tables}")
    
    if "properties" in tables:
        columns = [c["name"] for c in inspector.get_columns("properties")]
        print(f"Columns in 'properties': {columns}")
        
    if "property_views" in tables:
        print("'property_views' table already exists.")
    else:
        print("'property_views' table does NOT exist.")

if __name__ == "__main__":
    check_db()
