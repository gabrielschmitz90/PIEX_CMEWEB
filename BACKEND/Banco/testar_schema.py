"""Testa o cme_schema.sql sem mexer em nenhum banco de verdade.

Uso (na pasta BACKEND/Banco):
    python testar_schema.py                    -> testa o schema num banco temporario (so na memoria)
    python testar_schema.py ../../cme.db       -> alem disso, mostra o que falta no cme.db (so leitura)
"""
import sqlite3
import sys
from pathlib import Path

schema = Path(__file__).with_name("cme_schema.sql").read_text(encoding="utf-8")
falhas = 0


def verificar(descricao, ok):
    global falhas
    print(("  OK      " if ok else "  FALHOU  ") + descricao)
    falhas += 0 if ok else 1


def tabelas(conn):
    sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    return sorted(r[0] for r in conn.execute(sql))


bd = sqlite3.connect(":memory:")
bd.executescript(schema)
print("Tabelas que o schema cria:", ", ".join(tabelas(bd)))
print()
print("Testes:")

try:
    bd.executescript(schema)
    verificar("pode rodar duas vezes sem erro (nao apaga nada)", True)
except sqlite3.Error:
    verificar("pode rodar duas vezes sem erro (nao apaga nada)", False)

bd.execute("INSERT INTO departamentos (nome) VALUES ('Estudos')")
bd.execute("INSERT INTO equipe (nome, cargo) VALUES ('Fulano', 'Presidente')")
try:
    bd.execute("INSERT INTO departamento_membros (departamento_id, equipe_id) VALUES (1, 1)")
    verificar("vincular um membro da equipe a um departamento funciona", True)
except sqlite3.Error as e:
    verificar("vincular um membro da equipe a um departamento funciona (" + str(e) + ")", False)

bd.execute("DELETE FROM equipe WHERE id = 1")
r = bd.execute("SELECT equipe_id FROM departamento_membros").fetchone()
verificar("apagar um membro da equipe nao quebra o departamento", r is not None and r[0] is None)

for descricao, comando in [
    ("perfil de usuario invalido e recusado", "INSERT INTO usuarios (usuario, senha, perfil) VALUES ('a', 'b', 'DONO')"),
    ("categoria de evento invalida e recusada", "INSERT INTO eventos (titulo, data_evento, categoria) VALUES ('t', '2026-10-20', 'Festa')"),
    ("tipo de biblioteca invalido e recusado", "INSERT INTO biblioteca_itens (titulo, tipo, data_publicacao) VALUES ('t', 'Livro', '2026-01-01')"),
]:
    try:
        bd.execute(comando)
        verificar(descricao, False)
    except sqlite3.IntegrityError:
        verificar(descricao, True)

if len(sys.argv) > 1:
    caminho = Path(sys.argv[1])
    print()
    print("Comparando com", caminho, "(somente leitura):")
    if not caminho.exists():
        print("  arquivo nao encontrado")
    else:
        real = sqlite3.connect("file:" + caminho.resolve().as_posix() + "?mode=ro", uri=True)
        existentes, esperadas = set(tabelas(real)), set(tabelas(bd))
        print("  tabelas do arquivo:       ", ", ".join(sorted(existentes)) or "(nenhuma)")
        print("  faltam no arquivo:        ", ", ".join(sorted(esperadas - existentes)) or "(nenhuma)")
        print("  no arquivo e nao no schema:", ", ".join(sorted(existentes - esperadas)) or "(nenhuma)")

print()
print("Tudo certo." if falhas == 0 else str(falhas) + " teste(s) falharam.")
sys.exit(1 if falhas else 0)
