import subprocess
import os

def run_alembic_to_file():
    venv_python = os.path.join("backend", "venv", "Scripts", "python.exe")
    cmd = [venv_python, "-m", "alembic", "upgrade", "head"]
    
    with open("alembic_full_output.txt", "w", encoding="utf-8") as f:
        result = subprocess.run(
            cmd,
            cwd="backend",
            stdout=f,
            stderr=f,
            text=True
        )
    print(f"Alembic exited with code {result.returncode}")

if __name__ == "__main__":
    run_alembic_to_file()
