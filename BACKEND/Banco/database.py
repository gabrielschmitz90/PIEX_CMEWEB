import sqlite3

import config


def conectar():
    """Abre uma conexão com o banco. Quem abriu é quem fecha (conn.close())."""
    # check_same_thread=False: o FastAPI pode abrir e usar a conexão em threads diferentes
    conn = sqlite3.connect(config.DB_PATH, timeout=10, check_same_thread=False)
    conn.row_factory = sqlite3.Row            # permite ler linha["titulo"] em vez de linha[1]
    conn.execute("PRAGMA foreign_keys = ON")  # o SQLite só respeita as chaves estrangeiras com isto
    return conn


def get_db():
    """Para o FastAPI (usado nas rotas, nas próximas etapas): uma conexão por requisição."""
    conn = conectar()
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Cria o que falta a partir do cme_schema.sql. Pode rodar quantas vezes quiser:
    nunca apaga tabelas nem dados. Se o cme.db não existir, ele é criado."""
    config.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = conectar()
    try:
        conn.executescript(config.SCHEMA_PATH.read_text(encoding="utf-8"))
        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    # python database.py  -> cria/atualiza de verdade o banco (config.DB_PATH)
    init_db()
    conn = conectar()
    nomes = [r["name"] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY 1")]
    conn.close()
    print("Banco:", config.DB_PATH.resolve())
    print("Tabelas:", ", ".join(nomes))