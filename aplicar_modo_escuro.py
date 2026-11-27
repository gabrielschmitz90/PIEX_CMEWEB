"""
Adiciona UMA linha (<script src=".../tema.js">) no <head> das 6 páginas públicas.
Como usar (na raiz do projeto, onde ficam as pastas BACKEND e FRONTEND):

    python aplicar_modo_escuro.py

Pode rodar mais de uma vez: se a linha já existe, não duplica.
Não mexe em login/login.html nem em painel-admin.html.
"""
from pathlib import Path

FRONT = Path("FRONTEND")
PAGINAS = {
    "pagina-inicial.html": "scripts/tema.js",
    "paginas/agenda/agenda.html": "../../scripts/tema.js",
    "paginas/biblioteca/biblioteca.html": "../../scripts/tema.js",
    "paginas/contato/contato.html": "../../scripts/tema.js",
    "paginas/galeria/galeria.html": "../../scripts/tema.js",
    "paginas/quem-somos/quem-somos.html": "../../scripts/tema.js",
}

for rel, src in PAGINAS.items():
    arq = FRONT / rel
    if not arq.exists():
        print(f"[pulou] {rel}: arquivo não encontrado")
        continue
    texto = arq.read_text(encoding="utf-8")
    if "tema.js" in texto:
        print(f"[ok]    {rel}: já tinha")
        continue
    linha = f'  <script src="{src}"></script>\n'
    if "</head>" not in texto:
        print(f"[pulou] {rel}: sem </head>")
        continue
    arq.write_text(texto.replace("</head>", linha + "</head>", 1), encoding="utf-8")
    print(f"[feito] {rel}")
