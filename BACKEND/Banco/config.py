import os
from pathlib import Path

# Todos os arquivos ficam em BACKEND/Banco, a mesma pasta deste config.py
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "cme.db"
SCHEMA_PATH = BASE_DIR / "cme_schema.sql"

# Defina CME_SECRET como variável de ambiente em produção
SECRET_KEY = os.getenv("CME_SECRET", "troque-esta-chave")
ALGORITHM = "HS256"
TOKEN_HORAS = 8

# Origens do front (Live Server do VS Code usa a 5500)
CORS_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]