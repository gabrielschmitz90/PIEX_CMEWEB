import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import ALGORITHM, SECRET_KEY, TOKEN_HORAS
from database import get_db

bearer = HTTPBearer()
bearer_opcional = HTTPBearer(auto_error=False)


def gerar_hash(senha: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt, 200_000)
    return f"{salt.hex()}:{dk.hex()}"


def verificar_senha(senha: str, armazenado: str) -> bool:
    try:
        salt_hex, hash_hex = armazenado.split(":")
        novo = gerar_hash(senha, bytes.fromhex(salt_hex)).split(":")[1]
    except ValueError:
        return False
    return hmac.compare_digest(novo, hash_hex)


# Usado no login quando o usuário não existe, para o tempo de resposta ser igual
HASH_FALSO = gerar_hash("senha-falsa")


def criar_token(user) -> str:
    payload = {
        "sub": str(user["id"]),
        "usuario": user["usuario"],
        "perfil": user["perfil"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_HORAS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _validar(cred: HTTPAuthorizationCredentials, db) -> dict:
    try:
        payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGORITHM],
                             options={"require": ["exp", "sub"]})
        user_id = int(payload["sub"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(401, "Token inválido")
    # Confere no banco: usuário desativado/removido perde o acesso na hora,
    # e mudança de perfil vale imediatamente (não só quando o token expira).
    user = db.execute("SELECT id, usuario, nome, perfil, ativo FROM usuarios WHERE id = ?", (user_id,)).fetchone()
    if user is None or not user["ativo"]:
        raise HTTPException(401, "Usuário inativo ou inexistente")
    return dict(user)


def usuario_logado(cred: HTTPAuthorizationCredentials = Depends(bearer), db=Depends(get_db)):
    """Use como dependência nas rotas protegidas (ADMIN ou EDITOR)."""
    return _validar(cred, db)


def usuario_opcional(cred: HTTPAuthorizationCredentials | None = Depends(bearer_opcional), db=Depends(get_db)):
    """Rotas públicas que mostram mais coisas quando há login. Sem token -> None."""
    return _validar(cred, db) if cred else None


def exigir_admin(user=Depends(usuario_logado)):
    if user["perfil"] != "ADMIN":
        raise HTTPException(403, "Acesso restrito a administradores")
    return user