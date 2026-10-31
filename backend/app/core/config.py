import os
import json
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

# Points to /backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_FILE_PATH = os.path.join(BACKEND_DIR, ".env")
DB_PATH = os.path.join(BACKEND_DIR, "qualiroot.db")


class Settings(BaseSettings):
    PROJECT_NAME: str = "QualiRoot AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Environment & Database
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/qualiroot_db",
        description="PostgreSQL Connection URL (e.g., Neon Postgres)"
    )
    ALLOW_SQLITE_FALLBACK: bool = Field(
        default=True,
        description="Fallback to SQLite if PostgreSQL/Neon connection fails"
    )
    SQLITE_URL: str = f"sqlite:///{DB_PATH.replace(os.sep, '/')}"
    
    # Groq AI
    GROQ_API_KEY: str = Field(default="", description="Groq API Key")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", description="Default Groq LLM")
    GROQ_FALLBACK_MODELS: List[str] = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.3-70b-versatile"
    ]
    
    # Document & Upload
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".txt"]
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            return v
        url = v.strip().strip("'\"")
        
        # 1. Normalize dialect scheme for SQLAlchemy (convert postgres:// to postgresql://)
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        elif url.startswith("postgresql+psycopg2://"):
            url = url
            
        # 2. Automatically enforce sslmode=require for Neon PostgreSQL
        if "neon.tech" in url:
            if "sslmode=" not in url:
                delimiter = "&" if "?" in url else "?"
                url = f"{url}{delimiter}sslmode=require"
                
        return url

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.strip("[]").replace('"', '').split(",") if i.strip()]
        elif isinstance(v, (list, set)):
            return list(v)
        return ["*"]

    class Config:
        env_file = ENV_FILE_PATH
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
