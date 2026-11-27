"""
Cola o ajuste do menu mobile no final de FRONTEND/estilos/cabecalho.css.
Rodar na raiz do projeto (onde ficam BACKEND e FRONTEND), com o arquivo
ajuste-menu-mobile.css na mesma pasta:

    python aplicar_ajuste_mobile.py

Pode rodar mais de uma vez: não duplica.
"""
from pathlib import Path

alvo = Path("FRONTEND/estilos/cabecalho.css")
ajuste = Path("ajuste-menu-mobile.css")
marca = "AJUSTE DO MENU NO CELULAR"

if not alvo.exists() or not ajuste.exists():
    raise SystemExit("Arquivos não encontrados. Rode na raiz do projeto, com ajuste-menu-mobile.css ao lado.")

texto = alvo.read_text(encoding="utf-8")
if marca in texto:
    print("[ok] o ajuste já está no cabecalho.css")
else:
    alvo.write_text(texto.rstrip() + "\n\n" + ajuste.read_text(encoding="utf-8"), encoding="utf-8")
    print("[feito] ajuste adicionado ao final de cabecalho.css")
