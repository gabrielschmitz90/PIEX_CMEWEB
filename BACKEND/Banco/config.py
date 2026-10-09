import os
from pathlib import Path
# Este é o arquivo de configuração do banco de dados
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "cme.db"
SCHEMA_PATH = BASE_DIR / "cme_schema.sql"


SECRET_KEY = os.getenv("CME_SECRET", "7cd61c0866619e8f263290e4cfac40160870c9aaaab625e1424d0a8d0556d78a")
ALGORITHM = "HS256"
TOKEN_HORAS = 8


CORS_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]