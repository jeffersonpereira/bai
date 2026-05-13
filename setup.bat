@echo off
echo Iniciando servicos...

:: 1. Inicia o Backend (Entra na pasta E roda o Uvicorn)
start "Backend API" cmd /k "cd .\backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 40001"

:: 2. Inicia o Frontend (Entra na pasta E roda o Node)
start "Frontend" cmd /k "cd .\frontend && npm run dev"

:: 3. Inicia o WhatsApp Service (Entra na pasta E roda o Node)
start "WhatsApp Service" cmd /k "cd .\whatsapp-service && npm run dev"

echo Servicos iniciados!