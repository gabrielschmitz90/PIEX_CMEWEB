import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import ALGORITHM, SECRET_KEY, TOKEN_HORAS

bearer = HTTPBearer()


def gerar_hash(senha: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt, 200_000)
    return f"{salt.hex()}:{dk.hex()}"


def verificar_senha(senha: str, armazenado: str) -> bool:
    try:
        salt_hex, hash_hex = armazenado.split(":")
    except ValueError:
        return False
    novo = gerar_hash(senha, bytes.fromhex(salt_hex)).split(":")[1]
    return hmac.compare_digest(novo, hash_hex)


def criar_token(user) -> str:
    payload = {
        "sub": str(user["id"]),
        "usuario": user["usuario"],
        "perfil": user["perfil"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_HORAS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def usuario_logado(cred: HTTPAuthorizationCredentials = Depends(bearer)):
    """Use como dependência nas rotas protegidas."""
    try:
        return jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")


def exigir_admin(user=Depends(usuario_logado)):
    if user["perfil"] != "ADMIN":
        raise HTTPException(403, "Acesso restrito a administradores")
    return user