"""Testa o config.py + database.py SEM alterar o cme.db de verdade (usa copias temporarias).

Uso (na pasta BACKEND/Banco):   python testar_banco.py
"""
import hashlib
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

import config
import database

falhas = 0


def verificar(descricao, ok):
    global falhas
    print(("  OK      " if ok else "  FALHOU  ") + descricao)
    falhas += 0 if ok else 1


def tabelas(caminho):
    conn = sqlite3.connect(caminho)
    nomes = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
    conn.close()
    return nomes


def impressao(caminho):
    return hashlib.sha256(Path(caminho).read_bytes()).hexdigest() if Path(caminho).exists() else None


real = config.DB_PATH
antes = impressao(real)
print("Banco que a API vai usar:", real.resolve())
print("  ja existe?", "sim" if real.exists() else "nao (sera criado na primeira execucao)")
print("Schema:", config.SCHEMA_PATH.resolve())
if not config.SCHEMA_PATH.exists():
    sys.exit("  FALHOU  o cme_schema.sql nao esta nessa pasta")

pasta = Path(tempfile.mkdtemp(prefix="cme_teste_"))
try:
    print()
    print("1) Banco novo, do zero:")
    config.DB_PATH = pasta / "zero.db"
    database.init_db()
    esperadas = {"usuarios", "equipe", "eventos", "departamentos", "departamento_membros", "biblioteca_itens"}
    verificar("criou as 6 tabelas do schema", tabelas(config.DB_PATH) == esperadas)

    print()
    print("2) Copia do cme.db atual do time:")
    if not real.exists():
        print("  (nao ha cme.db ainda, pulando)")
    else:
        copia = pasta / "copia.db"
        shutil.copyfile(real, copia)
        config.DB_PATH = copia
        c = sqlite3.connect(copia)
        c.execute("INSERT INTO eventos (titulo, data_evento, categoria) VALUES ('Evento de teste', '2026-10-20', 'Reuniao')")
        c.commit()
        c.close()
        antes_tab = tabelas(copia)
        database.init_db()
        database.init_db()  # duas vezes de proposito
        depois_tab = tabelas(copia)
        print("     tabelas acrescentadas:", ", ".join(sorted(depois_tab - antes_tab)) or "(nenhuma, ja estava completo)")
        verificar("nenhuma tabela foi removida", antes_tab <= depois_tab)
        verificar("ficou com as 6 tabelas do schema (alem de outras que o time ja tinha)", esperadas <= depois_tab)
        c = database.conectar()
        verificar("os dados que ja existiam foram mantidos", c.execute("SELECT titulo FROM eventos").fetchone()["titulo"] == "Evento de teste")
        verificar("nao ha violacao de chave estrangeira", c.execute("PRAGMA foreign_key_check").fetchall() == [])
        c.execute("INSERT INTO departamentos (nome) VALUES ('Estudos')")
        try:
            c.execute("INSERT INTO departamento_membros (departamento_id, funcao) VALUES (1, 'x')")
            verificar("vincular membro a departamento funciona no banco atualizado", True)
        except sqlite3.Error:
            verificar("vincular membro a departamento funciona no banco atualizado", False)
        c.close()

    print()
    print("3) Conexao:")
    config.DB_PATH = pasta / "zero.db"
    conn = database.conectar()
    verificar("chaves estrangeiras ligadas", conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1)
    verificar("colunas lidas pelo nome (linha['x'])", conn.execute("SELECT 1 AS x").fetchone()["x"] == 1)
    conn.close()
    gerador = database.get_db()
    conexao = next(gerador)
    conexao.execute("SELECT 1")
    gerador.close()
    try:
        conexao.execute("SELECT 1")
        verificar("get_db fecha a conexao no fim da requisicao", False)
    except sqlite3.ProgrammingError:
        verificar("get_db fecha a conexao no fim da requisicao", True)
finally:
    config.DB_PATH = real
    shutil.rmtree(pasta, ignore_errors=True)

print()
verificar("o cme.db de verdade nao foi alterado por estes testes", impressao(real) == antes)
print()
print("Tudo certo." if falhas == 0 else str(falhas) + " teste(s) falharam.")
sys.exit(1 if falhas else 0)