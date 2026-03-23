from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db.database import engine, Base
from .models import user, property, favorite, owner, mandate, lead, appointment

import logging

logging.basicConfig(level=logging.INFO)

# Criar tabelas SQLite automaticamente (MVP)
Base.metadata.create_all(bind=engine)


app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import auth, properties, favorites, crm, team, admin, appointments

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(favorites.router)
app.include_router(crm.router)
app.include_router(team.router)
app.include_router(admin.router)
app.include_router(appointments.router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do BAI"}

