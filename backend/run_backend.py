import uvicorn
import sys
import os

# Garante que o diretório atual está no path
sys.path.append(os.getcwd())

from app.main import app

if __name__ == "__main__":
    print("Iniciando servidor BAI na porta 40001...")
    uvicorn.run(app, host="0.0.0.0", port=40001, log_level="debug")
