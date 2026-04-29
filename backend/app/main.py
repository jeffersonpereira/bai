import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.limiter import limiter

app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://bai-psi-neon\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

_MAX_REQUEST_BODY = 50 * 1024 * 1024  # 50 MB


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_REQUEST_BODY:
        return JSONResponse(status_code=413, content={"detail": "Request body muito grande"})
    return await call_next(request)


from app.routers import auth, imoveis, crm, agendamentos, favoritos, match, admin, equipe, propostas, vendedor, comissoes, visualizacoes, financiamento, documentos, whatsapp

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(imoveis.router, prefix=PREFIX)
app.include_router(crm.router, prefix=PREFIX)
app.include_router(agendamentos.router, prefix=PREFIX)
app.include_router(favoritos.router, prefix=PREFIX)
app.include_router(match.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)
app.include_router(equipe.router, prefix=PREFIX)
app.include_router(propostas.router, prefix=PREFIX)
app.include_router(vendedor.router, prefix=PREFIX)
app.include_router(comissoes.router, prefix=PREFIX)
app.include_router(visualizacoes.router, prefix=PREFIX)
app.include_router(financiamento.router, prefix=PREFIX)
app.include_router(documentos.router, prefix=PREFIX)
app.include_router(whatsapp.router, prefix=PREFIX)


@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do BAI", "version": "1.0", "docs": "/docs"}
