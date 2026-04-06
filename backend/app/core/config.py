from typing import List
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BAI Plataforma Imóveis"
    DEBUG: bool = False
    DATABASE_URL: str = "sqlite:///./bai.db"
    DATABASE_URL_UNPOOLED: str = ""  # Usado pelo Alembic (sem pgbouncer)
    SECRET_KEY: str = "DEV_SUPER_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY deve ter pelo menos 32 caracteres")
        return v

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if not self.DEBUG and self.SECRET_KEY == "DEV_SUPER_SECRET_KEY":
            raise ValueError(
                "SECRET_KEY não pode ser o valor padrão em produção (DEBUG=False). "
                "Gere uma chave segura com: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
