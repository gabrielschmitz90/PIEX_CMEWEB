"""Cria um usuário (ou redefine a senha de um existente) direto no banco.

Uso (na pasta BACKEND/Banco):
    python criar_usuario.py                      -> pergunta tudo
    python criar_usuario.py admin "Gabriel" ADMIN
    python criar_usuario.py admin --resetar      -> troca a senha do usuário 'admin'
"""
import getpass
import sqlite3
import sys

from database import conectar, init_db
from seguranca import gerar_hash


def pedir_senha() -> str:
    while True:
        s1 = getpass.getpass("Senha (mín. 8 caracteres): ")
        if len(s1) < 8:
            print("  Senha muito curta.")
            continue
        if s1 != getpass.getpass("Repita a senha: "):
            print("  As senhas não conferem.")
            continue
        return s1


def main():
    args = [a for a in sys.argv[1:] if a != "--resetar"]
    resetar = "--resetar" in sys.argv
    usuario = args[0] if args else input("Usuário: ").strip()
    init_db()
    conn = conectar()
    try:
        existe = conn.execute("SELECT id FROM usuarios WHERE usuario = ?", (usuario,)).fetchone()
        if resetar:
            if not existe:
                sys.exit(f"Usuário '{usuario}' não existe.")
            conn.execute("UPDATE usuarios SET senha = ?, ativo = 1 WHERE id = ?", (gerar_hash(pedir_senha()), existe["id"]))
            conn.commit()
            print(f"Senha de '{usuario}' redefinida.")
            return
        if existe:
            sys.exit(f"Usuário '{usuario}' já existe. Use --resetar para trocar a senha.")
        nome = args[1] if len(args) > 1 else input("Nome: ").strip() or None
        perfil = (args[2] if len(args) > 2 else input("Perfil (ADMIN/EDITOR) [ADMIN]: ").strip() or "ADMIN").upper()
        if perfil not in ("ADMIN", "EDITOR"):
            sys.exit("Perfil deve ser ADMIN ou EDITOR.")
        try:
            conn.execute("INSERT INTO usuarios (usuario, senha, nome, perfil) VALUES (?, ?, ?, ?)",
                         (usuario, gerar_hash(pedir_senha()), nome, perfil))
            conn.commit()
        except sqlite3.IntegrityError as e:
            sys.exit(f"Erro: {e}")
        print(f"Usuário '{usuario}' criado como {perfil}.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()