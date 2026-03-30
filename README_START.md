# Guia de Inicialização Manual - BAI

Para iniciar o projeto manualmente, siga estes passos em dois terminais separados:

## 1. Backend (FastAPI)
O backend deve ser executado na porta **40001** para evitar conflitos de socket no Windows.

```powershell
cd d:\Sources\BAI\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 40001
```

## 2. Frontend (Next.js)
O frontend se conectará automaticamente ao backend na porta 40001.

```powershell
cd d:\Sources\BAI\frontend
npm run dev
```

---
### Links Úteis:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Docs**: [http://localhost:4001/docs](http://localhost:15555/docs) (ou a porta atual configurada no backend)
- **Status API**: [http://localhost:40001/](http://localhost:40001/)
