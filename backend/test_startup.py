import traceback
import sys
import os

# Adiciona o diretório atual ao sys.path
sys.path.append(os.getcwd())

print(f"PYTHONPATH: {os.environ.get('PYTHONPATH')}")
print(f"CWD: {os.getcwd()}")

try:
    print("Importing app.main...")
    from app.main import app
    print("App imported successfully")
    
    from app.db.database import engine, Base
    import app.models
    print("Attempting to create tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")
    
except Exception:
    print("--- TRACEBACK START ---")
    traceback.print_exc()
    print("--- TRACEBACK END ---")
    sys.exit(1)
