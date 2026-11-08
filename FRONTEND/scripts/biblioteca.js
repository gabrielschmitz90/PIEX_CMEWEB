// Conteúdos públicos da biblioteca (GET /api/biblioteca).
(() => {
  const lista = document.getElementById("bibliotecaLista");
  const status = document.getElementById("bibliotecaStatus");
  const busca = document.getElementById("buscaBiblioteca");
  if (!lista || !status || typeof api !== "function") return;

  const normalizar = (valor) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const categoria = (tipo) => normalizar(tipo).replace(/publicacao/, "publicacao");
  const dataLegivel = (valor) => {
    const partes = String(valor || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : "";
  };

  let itens = [];
  let filtro = "todos";

  function exibir() {
    const termo = normalizar(busca?.value);
    const filtrados = itens.filter((item) => {
      const correspondeTipo = filtro === "todos" || categoria(item.tipo) === filtro;
      const texto = normalizar([item.titulo, item.resumo, item.autor, item.tipo].join(" "));
      return correspondeTipo && texto.includes(termo);
    });
    lista.replaceChildren();
    filtrados.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.category = categoria(item.tipo);

      const titulo = document.createElement("h3");
      titulo.className = "card-title";
      titulo.textContent = item.titulo;
      card.append(titulo);

      if (item.resumo) {
        const resumo = document.createElement("p");
        resumo.className = "card-text";
        resumo.textContent = item.resumo;
        card.append(resumo);
      }

      const rodape = document.createElement("div");
      rodape.className = "flex-between";
      const detalhes = [item.autor, dataLegivel(item.data_publicacao)].filter(Boolean).join(" · ");
      const meta = document.createElement("span");
      meta.textContent = detalhes || item.tipo;
      rodape.append(meta);

      const link = typeof item.link === "string" && /^https?:\/\//i.test(item.link) ? item.link : null;
      if (link) {
        const abrir = document.createElement("a");
        abrir.className = "badge badge-primary";
        abrir.href = link;
        abrir.target = "_blank";
        abrir.rel = "noopener noreferrer";
        abrir.textContent = "Acessar conteúdo";
        rodape.append(abrir);
      }
      card.append(rodape);
      lista.append(card);
    });
    status.textContent = filtrados.length ? "" : (itens.length ? "Nenhum conteúdo corresponde aos filtros." : "Nenhum conteúdo publicado no momento.");
  }

  document.querySelectorAll("[data-filter-btn]").forEach((botao) => {
    botao.addEventListener("click", () => {
      filtro = botao.dataset.filterBtn;
      document.querySelectorAll("[data-filter-btn]").forEach((outro) => {
        const ativo = outro === botao;
        outro.classList.toggle("btn-primary", ativo);
        outro.classList.toggle("btn-outline", !ativo);
        outro.setAttribute("aria-pressed", String(ativo));
      });
      exibir();
    });
    botao.setAttribute("aria-pressed", String(botao.dataset.filterBtn === "todos"));
  });
  busca?.addEventListener("input", exibir);

  api("/api/biblioteca", { auth: false })
    .then((resposta) => {
      itens = Array.isArray(resposta) ? resposta : [];
      lista.setAttribute("aria-busy", "false");
      exibir();
    })
    .catch(() => {
      lista.setAttribute("aria-busy", "false");
      status.textContent = "Não foi possível carregar a biblioteca agora. Tente novamente mais tarde.";
    });
})();
