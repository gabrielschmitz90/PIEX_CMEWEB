import os
import secrets
from pathlib import Path

# Este é o arquivo de configuração do banco de dados e da API
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("CME_DB") or BASE_DIR.parent.parent / "cme.db")  # cme.db da raiz do projeto
SCHEMA_PATH = BASE_DIR / "cme_schema.sql"
UPLOADS_DIR = Path(os.getenv("CME_UPLOADS") or BASE_DIR.parent.parent / "uploads")
FOTO_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _carregar_secret() -> str:
    """Chave do JWT: variável CME_SECRET, ou um arquivo .secret_key gerado na 1ª execução.
    Nunca deixe a chave escrita no código (quem vê o código forja tokens de ADMIN)."""
    chave = os.getenv("CME_SECRET")
    if chave:
        return chave
    arquivo = BASE_DIR / ".secret_key"
    if arquivo.exists():
        return arquivo.read_text(encoding="utf-8").strip()
    chave = secrets.token_hex(32)
    arquivo.write_text(chave, encoding="utf-8")
    return chave


SECRET_KEY = _carregar_secret()
ALGORITHM = "HS256"
TOKEN_HORAS = 8

CORS_ORIGINS = [
    f"http://{host}:{porta}"
    for host in ("127.0.0.1", "localhost")
    for porta in (5500, 5501, 5502, 5503, 3000, 8080)
]