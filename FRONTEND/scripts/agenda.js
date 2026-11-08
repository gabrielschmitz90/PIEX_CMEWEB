// Agenda pública: mostra na página os eventos cadastrados no painel (GET /api/eventos).
// Depende do api.js (carregado antes). Não exige login.
(function () {
  "use strict";

  // categoria vinda da API -> categoria usada nos botões de filtro da página
  var CATEGORIAS = {
    estudo:     { rotulo: "Estudo",     badge: "badge-primary",       fundo: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" },
    seminarios: { rotulo: "Seminários", badge: "badge-accent",        fundo: "linear-gradient(135deg, var(--color-accent), var(--color-accent-light))" },
    palestra:   { rotulo: "Palestra",   badge: "badge-success",       fundo: "linear-gradient(135deg, var(--color-success), #34D399)" },
    social:     { rotulo: "Social",     badge: "badge-info",          fundo: "linear-gradient(135deg, var(--color-info), var(--color-primary-light))" },
    reuniao:    { rotulo: "Reunião",    badge: "badge-primary-light", fundo: "linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-light))" },
  };
  var ALIAS = {
    estudo: "estudo", estudos: "estudo",
    seminario: "seminarios", seminarios: "seminarios",
    palestra: "palestra", palestras: "palestra",
    social: "social", sociais: "social",
    reuniao: "reuniao", reunioes: "reuniao",
  };

  function slugDaCategoria(categoria) {
    var chave = String(categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return ALIAS[chave] || "estudo";
  }

  function dois(n) { return (n < 10 ? "0" : "") + n; }

  function hojeISO(agora) {
    var d = agora || new Date();
    return d.getFullYear() + "-" + dois(d.getMonth() + 1) + "-" + dois(d.getDate());
  }

  // "2026-11-05" -> "05/11/2026" (sem usar Date, para não sofrer com fuso horário)
  function formatarData(iso) {
    var p = String(iso).split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(iso);
  }

  function formatarHorario(ev) {
    if (ev.hora_inicio && ev.hora_fim) return ev.hora_inicio + " - " + ev.hora_fim;
    return ev.hora_inicio || null;
  }

  function linkSeguro(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
  }

  // só eventos de hoje em diante, em ordem de data e hora
  function proximosEventos(eventos, hoje) {
    return eventos
      .filter(function (ev) { return String(ev.data_evento) >= hoje; })
      .sort(function (a, b) {
        var ka = a.data_evento + " " + (a.hora_inicio || ""), kb = b.data_evento + " " + (b.hora_inicio || "");
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      });
  }

  // Todo texto entra por textContent (nunca innerHTML): o que o admin digita não vira código na página.
  function criar(doc, tag, texto, estilo) {
    var e = doc.createElement(tag);
    if (texto !== undefined && texto !== null) e.textContent = texto;
    if (estilo) e.setAttribute("style", estilo);
    return e;
  }

  function criarCard(ev, doc) {
    var slug = slugDaCategoria(ev.categoria);
    var cat = CATEGORIAS[slug];

    var card = criar(doc, "div");
    card.className = "card";
    card.dataset.category = slug;

    var topo = criar(doc, "div", null, "background: " + cat.fundo + "; padding: 20px; border-radius: 6px; color: white; margin-bottom: 20px;");
    topo.appendChild(criar(doc, "p", "Próximo evento", "font-size: 0.9rem; margin: 0;"));
    topo.appendChild(criar(doc, "p", formatarData(ev.data_evento), "font-size: 2rem; font-weight: bold; margin: 10px 0 0 0;"));
    card.appendChild(topo);

    card.appendChild(criar(doc, "h4", ev.titulo));
    if (ev.palestrante) card.appendChild(criar(doc, "p", "Palestrante: " + ev.palestrante, "font-weight: bold;"));
    var horario = formatarHorario(ev);
    if (horario) card.appendChild(criar(doc, "p", horario, "color: var(--color-accent); font-weight: bold;"));
    if (ev.local) card.appendChild(criar(doc, "p", "Local: " + ev.local));
    if (ev.descricao) card.appendChild(criar(doc, "p", ev.descricao));

    var url = linkSeguro(ev.link_participacao);
    if (url) {
      var p = criar(doc, "p");
      var a = criar(doc, "a", "Participar da reunião");
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      p.appendChild(a);
      card.appendChild(p);
    }

    var rodape = criar(doc, "div");
    rodape.className = "flex-between";
    var badge = criar(doc, "span", cat.rotulo);
    badge.className = "badge " + cat.badge;
    rodape.appendChild(badge);
    card.appendChild(rodape);
    return card;
  }

  function mostrarMensagem(status, texto) {
    if (!status) return;
    status.textContent = texto || "";
    status.hidden = !texto;
  }

  // aplica o filtro (todos / estudo / palestra...) aos cards já desenhados
  function aplicarFiltro(container, status, filtro) {
    var cards = container.querySelectorAll("[data-category]");
    var visiveis = 0;
    for (var i = 0; i < cards.length; i++) {
      var mostrar = filtro === "todos" || cards[i].dataset.category === filtro;
      cards[i].style.display = mostrar ? "" : "none";
      if (mostrar) visiveis++;
    }
    if (cards.length > 0) {
      mostrarMensagem(status, visiveis === 0 ? "Nenhum evento nesta categoria no momento." : "");
    }
  }

  function desenhar(container, status, eventos, hoje, doc) {
    container.textContent = "";
    var lista = proximosEventos(eventos, hoje);
    lista.forEach(function (ev) { container.appendChild(criarCard(ev, doc)); });
    mostrarMensagem(status, lista.length === 0 ? "Nenhum evento programado no momento." : "");
    return lista.length;
  }

  function iniciar() {
    var container = document.getElementById("proximosEventos");
    var status = document.getElementById("agendaStatus");
    if (!container) return;

    var filtroAtual = "todos";
    document.querySelectorAll("[data-filter-btn]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        filtroAtual = botao.dataset.filterBtn;
        aplicarFiltro(container, status, filtroAtual);
      });
    });

    api("/api/eventos", { auth: false })
      .then(function (eventos) {
        desenhar(container, status, eventos, hojeISO(), document);
        aplicarFiltro(container, status, filtroAtual);
      })
      .catch(function () {
        mostrarMensagem(status, "Não foi possível carregar a agenda no momento. Tente novamente mais tarde.");
      });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { slugDaCategoria, hojeISO, formatarData, formatarHorario, linkSeguro, proximosEventos, criarCard, desenhar, aplicarFiltro };
  } else {
    iniciar();
  }
})();