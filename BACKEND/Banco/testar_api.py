"""Testa a API inteira com um banco e uma pasta de uploads TEMPORÁRIOS (não mexe no cme.db).

Uso (na pasta BACKEND/Banco):   python testar_api.py
Precisa do httpx:  pip install httpx
"""
import os
import sys
import tempfile
from pathlib import Path

tmp = Path(tempfile.mkdtemp(prefix="cme_api_"))
os.environ["CME_DB"] = str(tmp / "teste.db")
os.environ["CME_UPLOADS"] = str(tmp / "uploads")

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
import main  # noqa: E402
from seguranca import gerar_hash  # noqa: E402

falhas = 0


def verificar(descricao, ok):
    global falhas
    print(("  OK      " if ok else "  FALHOU  ") + descricao)
    falhas += 0 if ok else 1


database.init_db()
c = database.conectar()
c.execute("INSERT INTO usuarios (usuario, senha, nome, perfil) VALUES ('admin', ?, 'Admin', 'ADMIN')", (gerar_hash("senha1234"),))
c.execute("INSERT INTO usuarios (usuario, senha, nome, perfil) VALUES ('edit', ?, 'Editor', 'EDITOR')", (gerar_hash("senha1234"),))
c.execute("INSERT INTO usuarios (usuario, senha, perfil, ativo) VALUES ('inativo', ?, 'EDITOR', 0)", (gerar_hash("senha1234"),))
c.commit()
c.close()

with TestClient(main.app) as api:
    def entrar(u, s="senha1234"):
        r = api.post("/api/login", json={"usuario": u, "senha": s})
        return r, {"Authorization": "Bearer " + r.json().get("token", "x")}

    print("Login:")
    r, adm = entrar("admin")
    verificar("login correto devolve token", r.status_code == 200 and "token" in r.json())
    verificar("login não devolve a senha", "senha" not in r.json()["usuario"])
    verificar("senha errada -> 401", entrar("admin", "errada")[0].status_code == 401)
    verificar("usuário inexistente -> 401 (mesma resposta)", entrar("fantasma")[0].json() == entrar("admin", "errada")[0].json())
    verificar("usuário inativo não entra", entrar("inativo")[0].status_code == 401)
    _, edt = entrar("edit")
    verificar("bloqueia após 5 tentativas erradas (429)", [api.post("/api/login", json={"usuario": "bloq", "senha": "x"}).status_code for _ in range(6)][-1] == 429)

    print("Permissões:")
    verificar("rota protegida sem token -> 401/403", api.post("/api/eventos", json={}).status_code in (401, 403))
    verificar("token falso -> 401", api.get("/api/me", headers={"Authorization": "Bearer abc"}).status_code == 401)
    verificar("EDITOR não lista usuários (403)", api.get("/api/usuarios", headers=edt).status_code == 403)
    verificar("ADMIN lista usuários", api.get("/api/usuarios", headers=adm).status_code == 200)
    verificar("admin não consegue se desativar", api.put("/api/usuarios/1", json={"ativo": False}, headers=adm).status_code == 400)

    print("Eventos:")
    ev = {"titulo": "Palestra X", "data_evento": "2026-11-05", "categoria": "Palestra", "link_participacao": "https://exemplo.com"}
    r = api.post("/api/eventos", json=ev, headers=edt)
    verificar("EDITOR cria evento", r.status_code == 201)
    eid = r.json()["id"]
    verificar("link javascript: é recusado", api.post("/api/eventos", json={**ev, "link_participacao": "javascript:alert(1)"}, headers=edt).status_code == 422)
    verificar("categoria inválida recusada", api.post("/api/eventos", json={**ev, "categoria": "Festa"}, headers=edt).status_code == 422)
    verificar("data inválida recusada", api.post("/api/eventos", json={**ev, "data_evento": "05/11/2026"}, headers=edt).status_code == 422)
    verificar("lista pública mostra o evento", len(api.get("/api/eventos").json()) == 1)
    verificar("filtro por categoria", len(api.get("/api/eventos?categoria=Sociais").json()) == 0)
    verificar("editar evento", api.put(f"/api/eventos/{eid}", json={**ev, "titulo": "Novo"}, headers=edt).json()["titulo"] == "Novo")
    verificar("?todos=true sem login -> 401", api.get("/api/eventos?todos=true").status_code == 401)
    verificar("apagar desativa", api.delete(f"/api/eventos/{eid}", headers=edt).status_code == 204)
    verificar("evento apagado some da lista pública", api.get("/api/eventos").json() == [])
    verificar("...mas aparece para o admin com ?todos=true", len(api.get("/api/eventos?todos=true", headers=adm).json()) == 1)
    verificar("evento inexistente -> 404", api.put("/api/eventos/999", json=ev, headers=edt).status_code == 404)

    print("Equipe, foto e departamentos:")
    r = api.post("/api/equipe", json={"nome": "Fulano", "cargo": "Presidente"}, headers=edt)
    qid = r.json()["id"]
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 50
    r = api.post(f"/api/equipe/{qid}/foto", files={"arquivo": ("a.png", png, "image/png")}, headers=edt)
    verificar("upload de PNG funciona e a foto é servida", r.status_code == 200 and api.get(r.json()["url"]).status_code == 200)
    verificar("arquivo que não é imagem -> 415", api.post(f"/api/equipe/{qid}/foto", files={"arquivo": ("a.png", b"<script>", "image/png")}, headers=edt).status_code == 415)
    verificar("foto grande demais -> 413", api.post(f"/api/equipe/{qid}/foto", files={"arquivo": ("a.png", png + b"0" * (5 * 1024 * 1024), "image/png")}, headers=edt).status_code == 413)
    d = api.post("/api/departamentos", json={"nome": "Estudos"}, headers=edt).json()
    verificar("departamento duplicado -> 409", api.post("/api/departamentos", json={"nome": "Estudos"}, headers=edt).status_code == 409)
    verificar("vincula membro da equipe", api.post(f"/api/departamentos/{d['id']}/membros", json={"equipe_id": qid, "funcao": "Líder"}, headers=edt).status_code == 201)
    verificar("equipe inexistente -> 400", api.post(f"/api/departamentos/{d['id']}/membros", json={"equipe_id": 999}, headers=edt).status_code == 400)
    verificar("departamento lista membros com nome", api.get("/api/departamentos").json()[0]["membros"][0]["nome"] == "Fulano")

    print("Biblioteca e senha:")
    verificar("cria item da biblioteca", api.post("/api/biblioteca", json={"titulo": "Art", "tipo": "Artigo", "data_publicacao": "2026-01-01"}, headers=edt).status_code == 201)
    verificar("troca de senha com senha atual errada -> 400", api.post("/api/me/senha", json={"senha_atual": "x", "senha_nova": "novasenha1"}, headers=edt).status_code == 400)
    verificar("troca de senha funciona", api.post("/api/me/senha", json={"senha_atual": "senha1234", "senha_nova": "novasenha1"}, headers=edt).status_code == 204)
    verificar("login com a senha nova", entrar("edit", "novasenha1")[0].status_code == 200)
    novo = api.post("/api/usuarios", json={"usuario": "novo", "senha": "senha1234"}, headers=adm)
    verificar("admin cria usuário (perfil padrão EDITOR)", novo.status_code == 201 and novo.json()["perfil"] == "EDITOR")
    _, tk = entrar("novo")
    api.put(f"/api/usuarios/{novo.json()['id']}", json={"ativo": False}, headers=adm)
    verificar("usuário desativado perde acesso com o token antigo", api.get("/api/me", headers=tk).status_code == 401)

print()
print("Tudo certo." if falhas == 0 else str(falhas) + " teste(s) falharam.")
sys.exit(1 if falhas else 0)