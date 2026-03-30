import subprocess
import sys
import os

# Use standard path for backend
sys.path.append(os.path.abspath("backend"))

def run_alembic():
    # Caminho para o venv python
    venv_python = os.path.join("backend", "venv", "Scripts", "python.exe")
    
    # Comando para rodar alembic
    cmd = [venv_python, "-m", "alembic", "upgrade", "head"]
    
    try:
        # Run command and capture output
        result = subprocess.run(
            cmd,
            cwd="backend",
            capture_output=True,
            text=True,
            encoding="utf-8"
        )
        
        print("STDOUT:")
        print(result.stdout)
        print("\nSTDERR:")
        print(result.stderr)
        
        if result.returncode != 0:
            print(f"\nCommand failed with exit code {result.returncode}")
            
    except Exception as e:
        print(f"Failed to run alembic: {e}")

if __name__ == "__main__":
    run_alembic()
