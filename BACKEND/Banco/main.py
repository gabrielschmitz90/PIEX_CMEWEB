"""API do CMEWEB.  Rodar: rodar.bat   (ou: python -m uvicorn main:app --reload)
Documentação automática: http://127.0.0.1:8000/docs"""
import sqlite3
import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, field_validator

import config
from database import get_db, init_db
from seguranca import (HASH_FALSO, criar_token, exigir_admin, gerar_hash,
                       usuario_logado, usuario_opcional, verificar_senha)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


config.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app = FastAPI(title="CMEWEB API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.mount("/uploads", StaticFiles(directory=config.UPLOADS_DIR), name="uploads")


# ---------------------------------------------------------------- modelos
class Base(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


def _link_seguro(v: Optional[str]) -> Optional[str]:
    """Só aceita http(s): bloqueia javascript: e afins, que viram XSS quando o front usa href."""
    if v in (None, ""):
        return None
    if not v.lower().startswith(("http://", "https://")):
        raise ValueError("o link deve começar com http:// ou https://")
    return v


DATA = r"^\d{4}-\d{2}-\d{2}$"
HORA = r"^([01]\d|2[0-3]):[0-5]\d$"


class LoginIn(Base):
    usuario: str = Field(min_length=1, max_length=50)
    senha: str = Field(min_length=1, max_length=128)


class EventoIn(Base):
    titulo: str = Field(min_length=1, max_length=200)
    descricao: Optional[str] = Field(None, max_length=5000)
    data_evento: str = Field(pattern=DATA)
    hora_inicio: Optional[str] = Field(None, pattern=HORA)
    hora_fim: Optional[str] = Field(None, pattern=HORA)
    categoria: Literal["Estudo", "Seminário", "Seminarios", "Palestra", "Sociais", "Reunião", "Reuniao"]
    palestrante: Optional[str] = Field(None, max_length=200)
    local: Optional[str] = Field(None, max_length=200)
    link_participacao: Optional[str] = Field(None, max_length=500)
    ativo: bool = True
    _l = field_validator("link_participacao")(_link_seguro)


class BibliotecaIn(Base):
    titulo: str = Field(min_length=1, max_length=200)
    resumo: Optional[str] = Field(None, max_length=5000)
    tipo: Literal["Artigo", "Estudo", "Publicacao"]
    autor: Optional[str] = Field(None, max_length=200)
    data_publicacao: str = Field(pattern=DATA)
    link: Optional[str] = Field(None, max_length=500)
    ativo: bool = True
    _l = field_validator("link")(_link_seguro)


class EquipeIn(Base):
    nome: str = Field(min_length=1, max_length=200)
    cargo: str = Field(min_length=1, max_length=200)
    descricao: Optional[str] = Field(None, max_length=2000)
    ordem: int = 0
    ativo: bool = True


class DepartamentoIn(Base):
    nome: str = Field(min_length=1, max_length=200)
    descricao: Optional[str] = Field(None, max_length=2000)
    responsavel: Optional[str] = Field(None, max_length=200)
    ativo: bool = True


class MembroIn(Base):
    equipe_id: Optional[int] = None
    nome_membro: Optional[str] = Field(None, max_length=200)
    funcao: Optional[str] = Field(None, max_length=200)


class UsuarioIn(Base):
    usuario: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")
    senha: str = Field(min_length=8, max_length=128)
    nome: Optional[str] = Field(None, max_length=200)
    perfil: Literal["ADMIN", "EDITOR"] = "EDITOR"


class UsuarioUp(Base):
    nome: Optional[str] = Field(None, max_length=200)
    perfil: Optional[Literal["ADMIN", "EDITOR"]] = None
    ativo: Optional[bool] = None
    senha: Optional[str] = Field(None, min_length=8, max_length=128)


class TrocaSenhaIn(Base):
    senha_atual: str = Field(min_length=1, max_length=128)
    senha_nova: str = Field(min_length=8, max_length=128)


# ---------------------------------------------------------------- helpers de banco
def _valores(modelo: BaseModel) -> dict:
    return {k: (int(v) if isinstance(v, bool) else v) for k, v in modelo.model_dump().items()}


def _obter(db, tabela: str, id: int) -> dict:
    linha = db.execute(f"SELECT * FROM {tabela} WHERE id = ?", (id,)).fetchone()
    if linha is None:
        raise HTTPException(404, "Registro não encontrado")
    return dict(linha)


def _listar(db, tabela: str, ordem: str, todos: bool, user, filtros: dict | None = None) -> list[dict]:
    if todos and user is None:
        raise HTTPException(401, "Faça login para ver registros inativos")
    where, params = [], []
    if not todos:
        where.append("ativo = 1")
    for coluna, valor in (filtros or {}).items():
        if valor is not None:
            where.append(f"{coluna} = ?")
            params.append(valor)
    sql = f"SELECT * FROM {tabela}" + (" WHERE " + " AND ".join(where) if where else "") + f" ORDER BY {ordem}"
    return [dict(r) for r in db.execute(sql, params)]


def _inserir(db, tabela: str, dados: dict) -> dict:
    colunas = ", ".join(dados)
    marcas = ", ".join("?" for _ in dados)
    try:
        cur = db.execute(f"INSERT INTO {tabela} ({colunas}) VALUES ({marcas})", list(dados.values()))
        db.commit()
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(409, "Já existe um registro com esse nome")
    return _obter(db, tabela, cur.lastrowid)


def _atualizar(db, tabela: str, id: int, dados: dict) -> dict:
    _obter(db, tabela, id)
    sets = ", ".join(f"{c} = ?" for c in dados)
    try:
        db.execute(f"UPDATE {tabela} SET {sets} WHERE id = ?", [*dados.values(), id])
        db.commit()
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(409, "Já existe um registro com esse nome")
    return _obter(db, tabela, id)


def _desativar(db, tabela: str, id: int) -> None:
    _obter(db, tabela, id)
    db.execute(f"UPDATE {tabela} SET ativo = 0 WHERE id = ?", (id,))
    db.commit()


def _publico(user: dict) -> dict:
    return {"id": user["id"], "usuario": user["usuario"], "nome": user["nome"], "perfil": user["perfil"]}


# ---------------------------------------------------------------- login
_falhas: dict[str, list[float]] = defaultdict(list)
MAX_TENTATIVAS, JANELA_SEG = 5, 300


@app.post("/api/login")
def login(dados: LoginIn, request: Request, db=Depends(get_db)):
    chave = f"{request.client.host if request.client else '?'}|{dados.usuario.lower()}"
    agora = time.time()
    _falhas[chave] = [t for t in _falhas[chave] if agora - t < JANELA_SEG]
    if len(_falhas[chave]) >= MAX_TENTATIVAS:
        raise HTTPException(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.")

    user = db.execute("SELECT * FROM usuarios WHERE usuario = ?", (dados.usuario,)).fetchone()
    senha_ok = verificar_senha(dados.senha, user["senha"] if user else HASH_FALSO)
    if not user or not senha_ok or not user["ativo"]:
        _falhas[chave].append(agora)
        # mesma mensagem para tudo: não revela se o usuário existe ou está inativo
        raise HTTPException(401, "Usuário ou senha inválidos")

    _falhas.pop(chave, None)
    return {"token": criar_token(user), "usuario": _publico(user)}


@app.get("/api/me")
def me(user=Depends(usuario_logado)):
    return _publico(user)


@app.post("/api/me/senha", status_code=204)
def trocar_senha(dados: TrocaSenhaIn, user=Depends(usuario_logado), db=Depends(get_db)):
    atual = db.execute("SELECT senha FROM usuarios WHERE id = ?", (user["id"],)).fetchone()
    if not verificar_senha(dados.senha_atual, atual["senha"]):
        raise HTTPException(400, "Senha atual incorreta")
    db.execute("UPDATE usuarios SET senha = ? WHERE id = ?", (gerar_hash(dados.senha_nova), user["id"]))
    db.commit()


# ---------------------------------------------------------------- usuários (só ADMIN)
@app.get("/api/usuarios")
def listar_usuarios(_=Depends(exigir_admin), db=Depends(get_db)):
    return [dict(r) for r in db.execute("SELECT id, usuario, nome, perfil, ativo, criado_em FROM usuarios ORDER BY usuario")]


@app.post("/api/usuarios", status_code=201)
def criar_usuario(dados: UsuarioIn, _=Depends(exigir_admin), db=Depends(get_db)):
    try:
        cur = db.execute("INSERT INTO usuarios (usuario, senha, nome, perfil) VALUES (?, ?, ?, ?)",
                         (dados.usuario, gerar_hash(dados.senha), dados.nome, dados.perfil))
        db.commit()
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(409, "Esse nome de usuário já existe")
    return _publico(_obter(db, "usuarios", cur.lastrowid))


@app.put("/api/usuarios/{id}")
def editar_usuario(id: int, dados: UsuarioUp, admin=Depends(exigir_admin), db=Depends(get_db)):
    _obter(db, "usuarios", id)
    if id == admin["id"] and (dados.ativo is False or (dados.perfil and dados.perfil != "ADMIN")):
        raise HTTPException(400, "Você não pode desativar nem rebaixar a própria conta")
    campos = {}
    if dados.nome is not None:
        campos["nome"] = dados.nome
    if dados.perfil is not None:
        campos["perfil"] = dados.perfil
    if dados.ativo is not None:
        campos["ativo"] = int(dados.ativo)
    if dados.senha is not None:
        campos["senha"] = gerar_hash(dados.senha)
    if not campos:
        raise HTTPException(400, "Nada para atualizar")
    return _publico(_atualizar(db, "usuarios", id, campos))


# ---------------------------------------------------------------- eventos
@app.get("/api/eventos")
def listar_eventos(categoria: Optional[str] = None, todos: bool = False, user=Depends(usuario_opcional), db=Depends(get_db)):
    return _listar(db, "eventos", "data_evento, hora_inicio", todos, user, {"categoria": categoria})


@app.get("/api/eventos/{id}")
def ver_evento(id: int, db=Depends(get_db)):
    e = _obter(db, "eventos", id)
    if not e["ativo"]:
        raise HTTPException(404, "Registro não encontrado")
    return e


@app.post("/api/eventos", status_code=201)
def criar_evento(dados: EventoIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _inserir(db, "eventos", _valores(dados))


@app.put("/api/eventos/{id}")
def editar_evento(id: int, dados: EventoIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _atualizar(db, "eventos", id, _valores(dados))


@app.delete("/api/eventos/{id}", status_code=204)
def apagar_evento(id: int, _=Depends(usuario_logado), db=Depends(get_db)):
    _desativar(db, "eventos", id)


# ---------------------------------------------------------------- biblioteca
@app.get("/api/biblioteca")
def listar_biblioteca(tipo: Optional[str] = None, todos: bool = False, user=Depends(usuario_opcional), db=Depends(get_db)):
    return _listar(db, "biblioteca_itens", "data_publicacao DESC", todos, user, {"tipo": tipo})


@app.post("/api/biblioteca", status_code=201)
def criar_item(dados: BibliotecaIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _inserir(db, "biblioteca_itens", _valores(dados))


@app.put("/api/biblioteca/{id}")
def editar_item(id: int, dados: BibliotecaIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _atualizar(db, "biblioteca_itens", id, _valores(dados))


@app.delete("/api/biblioteca/{id}", status_code=204)
def apagar_item(id: int, _=Depends(usuario_logado), db=Depends(get_db)):
    _desativar(db, "biblioteca_itens", id)


# ---------------------------------------------------------------- equipe
@app.get("/api/equipe")
def listar_equipe(todos: bool = False, user=Depends(usuario_opcional), db=Depends(get_db)):
    return _listar(db, "equipe", "ordem, nome", todos, user)


@app.post("/api/equipe", status_code=201)
def criar_membro(dados: EquipeIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _inserir(db, "equipe", _valores(dados))


@app.put("/api/equipe/{id}")
def editar_membro(id: int, dados: EquipeIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _atualizar(db, "equipe", id, _valores(dados))


@app.delete("/api/equipe/{id}", status_code=204)
def apagar_membro(id: int, _=Depends(usuario_logado), db=Depends(get_db)):
    _desativar(db, "equipe", id)


def _extensao_imagem(dados: bytes) -> Optional[str]:
    """Confere o conteúdo real do arquivo (não confia no nome nem no Content-Type)."""
    if dados.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if dados.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if dados[:4] == b"RIFF" and dados[8:12] == b"WEBP":
        return ".webp"
    return None


@app.post("/api/equipe/{id}/foto")
def enviar_foto(id: int, arquivo: UploadFile = File(...), _=Depends(usuario_logado), db=Depends(get_db)):
    membro = _obter(db, "equipe", id)
    dados = arquivo.file.read(config.FOTO_MAX_BYTES + 1)
    if len(dados) > config.FOTO_MAX_BYTES:
        raise HTTPException(413, "Foto muito grande (máximo 5 MB)")
    ext = _extensao_imagem(dados)
    if ext is None:
        raise HTTPException(415, "Envie uma imagem JPG, PNG ou WEBP")
    nome = f"{uuid.uuid4().hex}{ext}"
    (config.UPLOADS_DIR / nome).write_bytes(dados)
    db.execute("UPDATE equipe SET foto = ? WHERE id = ?", (nome, id))
    db.commit()
    if membro["foto"]:
        (config.UPLOADS_DIR / Path(membro["foto"]).name).unlink(missing_ok=True)
    return {"foto": nome, "url": f"/uploads/{nome}"}


# ---------------------------------------------------------------- departamentos
@app.get("/api/departamentos")
def listar_departamentos(todos: bool = False, user=Depends(usuario_opcional), db=Depends(get_db)):
    deps = _listar(db, "departamentos", "nome", todos, user)
    for d in deps:
        d["membros"] = [dict(r) for r in db.execute(
            """SELECT m.id, m.equipe_id, COALESCE(e.nome, m.nome_membro) AS nome, m.funcao, e.foto
               FROM departamento_membros m LEFT JOIN equipe e ON e.id = m.equipe_id
               WHERE m.departamento_id = ? ORDER BY nome""", (d["id"],))]
    return deps


@app.post("/api/departamentos", status_code=201)
def criar_departamento(dados: DepartamentoIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _inserir(db, "departamentos", _valores(dados))


@app.put("/api/departamentos/{id}")
def editar_departamento(id: int, dados: DepartamentoIn, _=Depends(usuario_logado), db=Depends(get_db)):
    return _atualizar(db, "departamentos", id, _valores(dados))


@app.delete("/api/departamentos/{id}", status_code=204)
def apagar_departamento(id: int, _=Depends(usuario_logado), db=Depends(get_db)):
    _desativar(db, "departamentos", id)


@app.post("/api/departamentos/{id}/membros", status_code=201)
def adicionar_membro(id: int, dados: MembroIn, _=Depends(usuario_logado), db=Depends(get_db)):
    _obter(db, "departamentos", id)
    if dados.equipe_id is None and not dados.nome_membro:
        raise HTTPException(422, "Informe equipe_id ou nome_membro")
    try:
        cur = db.execute("INSERT INTO departamento_membros (departamento_id, equipe_id, nome_membro, funcao) VALUES (?, ?, ?, ?)",
                         (id, dados.equipe_id, dados.nome_membro, dados.funcao))
        db.commit()
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(400, "Membro da equipe inexistente")
    return _obter(db, "departamento_membros", cur.lastrowid)


@app.delete("/api/departamentos/{id}/membros/{membro_id}", status_code=204)
def remover_membro(id: int, membro_id: int, _=Depends(usuario_logado), db=Depends(get_db)):
    cur = db.execute("DELETE FROM departamento_membros WHERE id = ? AND departamento_id = ?", (membro_id, id))
    db.commit()
    if cur.rowcount == 0:
        raise HTTPException(404, "Registro não encontrado")

if config.FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=config.FRONTEND_DIR, html=True), name="site")