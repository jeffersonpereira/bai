import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import auth, properties, crm, appointments, favorites, match, admin, team, proposals, seller, comissoes, views, financing, whatsapp

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(properties.router, prefix=PREFIX)
app.include_router(crm.router, prefix=PREFIX)
app.include_router(appointments.router, prefix=PREFIX)
app.include_router(favorites.router, prefix=PREFIX)
app.include_router(match.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)
app.include_router(team.router, prefix=PREFIX)
app.include_router(proposals.router, prefix=PREFIX)
app.include_router(seller.router, prefix=PREFIX)
app.include_router(comissoes.router, prefix=PREFIX)
app.include_router(views.router, prefix=PREFIX)
app.include_router(financing.router, prefix=PREFIX)
app.include_router(whatsapp.router, prefix=PREFIX)


@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do BAI", "version": "1.0", "docs": "/docs"}
