/* ==========================================================
   MODO ESCURO - CME
   Local no projeto: FRONTEND/scripts/tema.js
   - Padrão: site CLARO (nada muda para quem não clicar no botão).
   - Guarda a escolha no navegador do visitante.
   - O CSS escuro só é baixado quando o modo escuro é usado.
   ========================================================== */
(function () {
  var CHAVE = "cme-tema";
  var raiz = document.documentElement;

  // Descobre onde está o tema-escuro.css a partir do caminho deste script
  var atual = document.currentScript;
  var urlCss = atual && atual.src
    ? atual.src.replace(/scripts\/tema\.js(\?.*)?$/, "assets/cores/tema-escuro.css")
    : null;

  function lerEscolha() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }
  function salvarEscolha(valor) {
    try { localStorage.setItem(CHAVE, valor); } catch (e) { /* ignora */ }
  }

  function garantirCss() {
    if (!urlCss || document.getElementById("tema-escuro-css")) return;
    var link = document.createElement("link");
    link.id = "tema-escuro-css";
    link.rel = "stylesheet";
    link.href = urlCss;
    document.head.appendChild(link);
  }

  var botao = null;
  function atualizarBotao() {
    if (!botao) return;
    var escuro = raiz.getAttribute("data-tema") === "escuro";
    botao.setAttribute("aria-pressed", escuro ? "true" : "false");
    botao.setAttribute("aria-label", escuro ? "Ativar modo claro" : "Ativar modo escuro");
    botao.title = escuro ? "Modo claro" : "Modo escuro";
    botao.innerHTML = escuro
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  }

  function aplicar(tema) {
    if (tema === "escuro") {
      garantirCss();
      raiz.setAttribute("data-tema", "escuro");
    } else {
      raiz.removeAttribute("data-tema");
    }
    atualizarBotao();
  }

  // Aplica a escolha salva o mais cedo possível (evita piscar claro->escuro)
  if (lerEscolha() === "escuro") aplicar("escuro");

  function criarBotao() {
    var estilo = document.createElement("style");
    estilo.textContent =
      ".tema-botao{position:fixed;right:16px;bottom:16px;z-index:900;width:44px;height:44px;" +
      "display:flex;align-items:center;justify-content:center;border-radius:50%;" +
      "border:1px solid #cccccc;background:#ffffff;color:#243789;cursor:pointer;" +
      "box-shadow:0 4px 14px rgba(0,0,0,.2);padding:0;}" +
      ".tema-botao:hover{transform:scale(1.06);}" +
      ".tema-botao:focus-visible{outline:3px solid #9C4080;outline-offset:2px;}" +
      "@media (prefers-reduced-motion:reduce){.tema-botao:hover{transform:none;}}";
    document.head.appendChild(estilo);

    botao = document.createElement("button");
    botao.type = "button";
    botao.className = "tema-botao";
    botao.addEventListener("click", function () {
      var proximo = raiz.getAttribute("data-tema") === "escuro" ? "claro" : "escuro";
      aplicar(proximo);
      salvarEscolha(proximo);
    });
    document.body.appendChild(botao);
    atualizarBotao();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", criarBotao);
  } else {
    criarBotao();
  }
})();
