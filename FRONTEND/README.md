# CME - Site da Cruzada dos Militares Espíritas

## Estrutura do Projeto

```
CME-Site/
│
├── pagina-inicial.html         → Página principal do site (Home)
├── painel-admin.html           → Painel para o administrador cadastrar o Desafio da Semana
│
├── paginas/
│   ├── quem-somos/
│   │   └── quem-somos.html     → História, missão, visão e equipe da CME
│   ├── biblioteca/
│   │   └── biblioteca.html     → Artigos, estudos e publicações
│   ├── agenda/
│   │   └── agenda.html         → Calendário e próximos eventos
│   ├── galeria/
│   │   └── galeria.html        → Fotos, vídeos e álbuns
│   └── contato/
│       └── contato.html        → Formulário e informações de contato
│
├── estilos/
│   ├── estilos-globais.css     → Arquivo principal que importa todos os outros CSS
│   ├── reset.css               → Remove estilos padrão do navegador
│   ├── layout.css              → Grid, flex, seções, espaçamentos
│   ├── componentes.css         → Cards, badges, botões, alertas, formulários
│   ├── animacoes.css           → Efeitos de transição e animações
│   ├── cabecalho.css           → Estilo do header / navegação
│   └── secao-hero.css          → Estilo da seção principal (banner de topo)
│
├── scripts/
│   ├── navegacao.js            → Destaca o link ativo no menu, scroll suave, validação de formulário
│   └── efeitos-visuais.js      → Efeito ripple nos botões, scroll do header, partículas no hero
│
├── assets/
│   ├── cores/
│   │   └── paleta-cores.css    → Variáveis CSS com todas as cores do projeto
│   └── fontes/
│       └── tipografia.css      → Fontes (Montserrat e Inter) e tamanhos de texto
│
└── imagens/
    ├── logo.svg                → Logotipo da CME
    └── simbolo-cme.jpg         → Símbolo oficial da CME
```

## Como funciona cada parte

### Páginas HTML
Cada página tem a mesma estrutura: `<header>` (menu de navegação), `<main>` (conteúdo da página) e `<footer>` (rodapé com links e redes sociais).

### Estilos CSS
O arquivo `estilos-globais.css` importa todos os outros, então basta incluir ele nas páginas. As cores ficam em `paleta-cores.css` como variáveis CSS (ex: `var(--color-primary)`), o que facilita mudanças globais.

### Scripts JavaScript
`navegacao.js` cuida de comportamentos de navegação (menu ativo, scroll suave, validação). `efeitos-visuais.js` adiciona animações visuais como o efeito de ondas nos botões e as partículas flutuantes no banner.

### Painel Admin
A página `painel-admin.html` permite ao diretor cadastrar o "Desafio da Semana" (tema, cruzadinha, versículo e resposta). Os dados ficam salvos no `localStorage` do navegador e aparecem automaticamente na página inicial.
