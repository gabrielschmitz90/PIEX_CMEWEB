// Lógica do painel-admin.html. Ordem dos scripts: api.js -> guarda-painel.js -> este.
(() => {
  // ------------------------------------------------------------ configuração dos recursos
  // c = coluna da tabela: [campo, rótulo, função opcional que devolve HTML seguro]
  // campos: n=nome, r=rótulo, t=tipo, req=obrigatório, op=opções (select), soCriar=só ao criar
  const CATEGORIAS = ["Estudo", "Seminário", "Palestra", "Sociais", "Reunião"];
  const RECURSOS = {
    eventos: {
      titulo: "Eventos", rota: "/api/eventos",
      colunas: [["titulo", "Título"], ["data_evento", "Data"], ["categoria", "Categoria"], ["local", "Local"]],
      campos: [
        { n: "titulo", r: "Título", t: "text", req: true },
        { n: "categoria", r: "Categoria", t: "select", op: CATEGORIAS, req: true },
        { n: "data_evento", r: "Data", t: "date", req: true },
        { n: "hora_inicio", r: "Hora de início", t: "time" },
        { n: "hora_fim", r: "Hora de fim", t: "time" },
        { n: "palestrante", r: "Palestrante", t: "text" },
        { n: "local", r: "Local", t: "text" },
        { n: "link_participacao", r: "Link de participação (http/https)", t: "url" },
        { n: "descricao", r: "Descrição", t: "textarea" },
        { n: "ativo", r: "Ativo (visível no site)", t: "checkbox" },
      ],
    },
    biblioteca: {
      titulo: "Biblioteca", rota: "/api/biblioteca",
      colunas: [["titulo", "Título"], ["tipo", "Tipo"], ["autor", "Autor"], ["data_publicacao", "Publicação"]],
      campos: [
        { n: "titulo", r: "Título", t: "text", req: true },
        { n: "tipo", r: "Tipo", t: "select", op: ["Artigo", "Estudo", "Publicacao"], req: true },
        { n: "autor", r: "Autor", t: "text" },
        { n: "data_publicacao", r: "Data de publicação", t: "date", req: true },
        { n: "link", r: "Link (http/https)", t: "url" },
        { n: "resumo", r: "Resumo", t: "textarea" },
        { n: "ativo", r: "Ativo (visível no site)", t: "checkbox" },
      ],
    },
    equipe: {
      titulo: "Equipe", rota: "/api/equipe", foto: true,
      colunas: [
        ["foto", "Foto", (r) => r.foto ? `<img class="pa-foto" src="${esc(API_URL + "/uploads/" + r.foto)}" alt="">` : "—"],
        ["nome", "Nome"], ["cargo", "Cargo"], ["ordem", "Ordem"],
      ],
      campos: [
        { n: "nome", r: "Nome", t: "text", req: true },
        { n: "cargo", r: "Cargo", t: "text", req: true },
        { n: "descricao", r: "Descrição", t: "textarea" },
        { n: "ordem", r: "Ordem de exibição", t: "number" },
        { n: "ativo", r: "Ativo (visível no site)", t: "checkbox" },
      ],
    },
    departamentos: {
      titulo: "Departamentos", rota: "/api/departamentos", membros: true,
      colunas: [["nome", "Nome"], ["responsavel", "Responsável"], ["membros", "Membros", (r) => String((r.membros || []).length)]],
      campos: [
        { n: "nome", r: "Nome", t: "text", req: true },
        { n: "responsavel", r: "Responsável", t: "text" },
        { n: "descricao", r: "Descrição", t: "textarea" },
        { n: "ativo", r: "Ativo (visível no site)", t: "checkbox" },
      ],
    },
    usuarios: {
      titulo: "Usuários", rota: "/api/usuarios", usuarios: true, listar: "/api/usuarios",
      colunas: [["usuario", "Usuário"], ["nome", "Nome"], ["perfil", "Perfil"]],
      campos: [
        { n: "usuario", r: "Usuário (letras, números, . _ -)", t: "text", req: true, soCriar: true },
        { n: "nome", r: "Nome", t: "text" },
        { n: "perfil", r: "Perfil", t: "select", op: ["EDITOR", "ADMIN"], req: true },
        { n: "senha", r: "Senha (mín. 8 caracteres)", t: "password", reqCriar: true, min: 8 },
        { n: "ativo", r: "Ativo (pode entrar)", t: "checkbox", soEditar: true },
      ],
    },
  };

  // ------------------------------------------------------------ utilidades
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtData = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s.split("-").reverse().join("/") : s);

  let atual = "eventos";
  let dados = [];
  let editando = null; // registro em edição, ou null ao criar
  let usuarioLogado = null;

  async function chamar(caminho, op) {
    try {
      return await api(caminho, op);
    } catch (e) {
      if (e.status === 401) sairDoPainel(); // sessão expirada
      throw e;
    }
  }

  let timerMsg;
  function mensagem(texto, erro = false) {
    const el = $("pa-msg");
    el.textContent = texto;
    el.className = "pa-msg" + (erro ? " erro" : "");
    el.hidden = false;
    clearTimeout(timerMsg);
    timerMsg = setTimeout(() => (el.hidden = true), 5000);
  }

  // ------------------------------------------------------------ início
  function iniciar(user) {
    usuarioLogado = user;
    $("pa-usuario").textContent = (user.nome || user.usuario) + " (" + user.perfil + ")";
    $("pa-aba-usuarios").hidden = user.perfil !== "ADMIN";
    $("pa-app").hidden = false;
    $("pa-sair").onclick = sairDoPainel;
    $("pa-abas").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-aba]");
      if (b) trocarAba(b.dataset.aba);
    });
    $("pa-novo").onclick = () => abrirForm(null);
    $("pa-tabela").addEventListener("click", cliqueTabela);
    $("pa-form").addEventListener("submit", salvar);
    $("pa-cancelar").onclick = () => $("pa-modal").close();
    $("pa-membros-fechar").onclick = () => $("pa-membros").close();
    $("pa-membro-form").addEventListener("submit", adicionarMembro);
    $("pa-membros-lista").addEventListener("click", cliqueMembros);
    trocarAba("eventos");
  }

  if (window.cmeUsuario) iniciar(window.cmeUsuario);
  else document.addEventListener("cme:autenticado", (e) => iniciar(e.detail), { once: true });

  function trocarAba(chave) {
    atual = chave;
    document.querySelectorAll("#pa-abas button").forEach((b) => b.classList.toggle("ativa", b.dataset.aba === chave));
    $("pa-titulo").textContent = RECURSOS[chave].titulo;
    carregar();
  }

  // ------------------------------------------------------------ lista
  async function carregar() {
    const R = RECURSOS[atual];
    $("pa-tabela").innerHTML = '<div class="pa-vazio">Carregando...</div>';
    try {
      dados = await chamar(R.listar || R.rota + "?todos=true");
      renderTabela();
    } catch (e) {
      $("pa-tabela").innerHTML = `<div class="pa-vazio">${esc(e.message)}</div>`;
    }
  }

  function renderTabela() {
    const R = RECURSOS[atual];
    if (!dados.length) {
      $("pa-tabela").innerHTML = '<div class="pa-vazio">Nada cadastrado ainda. Clique em “+ Novo”.</div>';
      return;
    }
    const cab = R.colunas.map((c) => `<th>${esc(c[1])}</th>`).join("") + "<th>Status</th><th>Ações</th>";
    const linhas = dados.map((r) => {
      const cels = R.colunas.map((c) => {
        if (c[2]) return `<td>${c[2](r)}</td>`;
        const v = c[0].startsWith("data") ? fmtData(r[c[0]]) : r[c[0]];
        return `<td>${esc(v === null || v === undefined || v === "" ? "—" : v)}</td>`;
      }).join("");
      const ativo = !!r.ativo;
      const botoes =
        `<button class="pa-btn pa-btn-sec pa-btn-peq" data-acao="editar" data-id="${r.id}">Editar</button>` +
        (R.membros ? `<button class="pa-btn pa-btn-sec pa-btn-peq" data-acao="membros" data-id="${r.id}">Membros</button>` : "") +
        `<button class="pa-btn ${ativo ? "pa-btn-perigo" : "pa-btn-sec"} pa-btn-peq" data-acao="ativo" data-id="${r.id}">${ativo ? "Desativar" : "Reativar"}</button>`;
      return `<tr class="${ativo ? "" : "inativo"}">${cels}<td><span class="pa-selo ${ativo ? "" : "off"}">${ativo ? "Ativo" : "Inativo"}</span></td><td><div class="pa-acoes">${botoes}</div></td></tr>`;
    }).join("");
    $("pa-tabela").innerHTML = `<table><thead><tr>${cab}</tr></thead><tbody>${linhas}</tbody></table>`;
  }

  function cliqueTabela(e) {
    const b = e.target.closest("button[data-acao]");
    if (!b) return;
    const rec = dados.find((r) => r.id === Number(b.dataset.id));
    if (!rec) return;
    if (b.dataset.acao === "editar") abrirForm(rec);
    else if (b.dataset.acao === "membros") abrirMembros(rec.id);
    else if (b.dataset.acao === "ativo") alternarAtivo(rec);
  }

  async function alternarAtivo(rec) {
    const R = RECURSOS[atual];
    const novo = !rec.ativo;
    if (!novo && !confirm("Desativar este registro? Ele deixa de aparecer no site (você pode reativar depois).")) return;
    try {
      if (R.usuarios) {
        await chamar(`${R.rota}/${rec.id}`, { metodo: "PUT", corpo: { ativo: novo } });
      } else if (!novo) {
        await chamar(`${R.rota}/${rec.id}`, { metodo: "DELETE" });
      } else {
        const corpo = {};
        R.campos.forEach((c) => (corpo[c.n] = c.t === "checkbox" ? !!rec[c.n] : rec[c.n]));
        corpo.ativo = true;
        await chamar(`${R.rota}/${rec.id}`, { metodo: "PUT", corpo });
      }
      mensagem(novo ? "Registro reativado." : "Registro desativado.");
      await carregar();
    } catch (e) {
      mensagem(e.message, true);
    }
  }

  // ------------------------------------------------------------ formulário
  function campoHtml(c, valor, obrigatorio) {
    const id = "f_" + c.n;
    const req = obrigatorio ? "required" : "";
    let rotulo = c.r;
    if (c.reqCriar && editando) rotulo = "Nova senha (deixe em branco para manter)";
    let controle;
    if (c.t === "textarea") {
      controle = `<textarea id="${id}" name="${c.n}" rows="3" ${req}>${esc(valor)}</textarea>`;
    } else if (c.t === "select") {
      const ops = [...c.op];
      if (valor && !ops.includes(valor)) ops.push(valor); // mantém valores antigos (ex.: "Reuniao")
      controle = `<select id="${id}" name="${c.n}" ${req}>${ops.map((o) => `<option value="${esc(o)}" ${o === valor ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    } else if (c.t === "checkbox") {
      return `<label class="pa-campo check"><input type="checkbox" id="${id}" name="${c.n}" ${valor ? "checked" : ""}> ${esc(rotulo)}</label>`;
    } else {
      const min = c.min ? `minlength="${c.min}"` : "";
      const auto = c.t === "password" ? 'autocomplete="new-password"' : "";
      controle = `<input type="${c.t}" id="${id}" name="${c.n}" value="${esc(valor)}" ${req} ${min} ${auto}>`;
    }
    return `<label class="pa-campo">${esc(rotulo)}${controle}</label>`;
  }

  function abrirForm(rec) {
    const R = RECURSOS[atual];
    editando = rec;
    $("pa-modal-titulo").textContent = (rec ? "Editar" : "Novo") + " — " + R.titulo;
    const visiveis = R.campos.filter((c) => !(rec && c.soCriar) && !(!rec && c.soEditar));
    let html = visiveis.map((c) => {
      let valor = rec ? rec[c.n] : c.t === "checkbox" ? true : c.t === "select" ? c.op[0] : c.n === "ordem" ? 0 : "";
      if (c.t === "checkbox" && rec) valor = !!rec[c.n];
      if (c.t === "password") valor = "";
      return campoHtml(c, valor, c.req || (c.reqCriar && !rec));
    }).join("");
    if (R.foto) {
      html += `<label class="pa-campo">Foto (JPG, PNG ou WEBP, até 5 MB)<input type="file" name="foto_arquivo" accept="image/png,image/jpeg,image/webp"></label>`;
    }
    $("pa-campos").innerHTML = html;
    $("pa-erro").hidden = true;
    $("pa-modal").showModal();
  }

  function lerFormulario() {
    const R = RECURSOS[atual];
    const form = $("pa-form");
    const corpo = {};
    for (const c of R.campos) {
      const el = form.elements[c.n];
      if (!el) continue; // campo que não aparece neste modo
      if (c.t === "checkbox") { corpo[c.n] = el.checked; continue; }
      let v = el.value.trim();
      if (c.t === "password" && v === "") continue; // edição: manter a senha atual
      if (c.t === "number") v = v === "" ? 0 : parseInt(v, 10);
      else if (v === "" && !c.req) v = null;
      corpo[c.n] = v;
    }
    return corpo;
  }

  async function enviarFoto(id, arquivo) {
    const fd = new FormData();
    fd.append("arquivo", arquivo);
    const resp = await fetch(API_URL + `/api/equipe/${id}/foto`, {
      method: "POST", headers: { Authorization: "Bearer " + Auth.token() }, body: fd,
    });
    if (!resp.ok) {
      const d = await resp.json().catch(() => null);
      throw new Error((d && typeof d.detail === "string" && d.detail) || "Falha ao enviar a foto");
    }
  }

  async function salvar(e) {
    e.preventDefault();
    const R = RECURSOS[atual];
    const form = $("pa-form");
    const erro = $("pa-erro");
    erro.hidden = true;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const botao = $("pa-salvar");
    botao.disabled = true;
    try {
      const corpo = lerFormulario();
      const salvo = editando
        ? await chamar(`${R.rota}/${editando.id}`, { metodo: "PUT", corpo })
        : await chamar(R.rota, { metodo: "POST", corpo });
      const arquivo = form.elements["foto_arquivo"] && form.elements["foto_arquivo"].files[0];
      let aviso = "Salvo com sucesso.";
      if (R.foto && arquivo) {
        try { await enviarFoto(salvo.id, arquivo); }
        catch (fe) { aviso = "Registro salvo, mas a foto falhou: " + fe.message; }
      }
      $("pa-modal").close();
      mensagem(aviso, aviso !== "Salvo com sucesso.");
      await carregar();
    } catch (err) {
      erro.textContent = err.message;
      erro.hidden = false;
    } finally {
      botao.disabled = false;
    }
  }

  // ------------------------------------------------------------ membros de departamento
  let depAberto = null;

  async function abrirMembros(depId) {
    depAberto = depId;
    $("pa-membros-erro").hidden = true;
    $("pa-membro-nome").value = "";
    $("pa-membro-funcao").value = "";
    try {
      const equipe = await chamar("/api/equipe");
      $("pa-membro-equipe").innerHTML =
        '<option value="">— outra pessoa (digite o nome) —</option>' +
        equipe.map((m) => `<option value="${m.id}">${esc(m.nome)}</option>`).join("");
    } catch (e) {
      $("pa-membros-erro").textContent = e.message;
      $("pa-membros-erro").hidden = false;
    }
    renderMembros();
    $("pa-membros").showModal();
  }

  function renderMembros() {
    const dep = dados.find((d) => d.id === depAberto);
    if (!dep) return;
    $("pa-membros-titulo").textContent = "Membros — " + dep.nome;
    const itens = dep.membros || [];
    $("pa-membros-lista").innerHTML = itens.length
      ? itens.map((m) => `<div class="pa-membro-item"><span>${esc(m.nome || "—")}${m.funcao ? " · " + esc(m.funcao) : ""}</span>` +
          `<button class="pa-btn pa-btn-perigo pa-btn-peq" data-membro="${m.id}">Remover</button></div>`).join("")
      : '<div class="pa-vazio">Nenhum membro neste departamento.</div>';
  }

  async function adicionarMembro(e) {
    e.preventDefault();
    const erro = $("pa-membros-erro");
    erro.hidden = true;
    const equipeId = $("pa-membro-equipe").value;
    const nome = $("pa-membro-nome").value.trim();
    if (!equipeId && !nome) {
      erro.textContent = "Escolha alguém da equipe ou digite um nome.";
      erro.hidden = false;
      return;
    }
    try {
      await chamar(`/api/departamentos/${depAberto}/membros`, {
        metodo: "POST",
        corpo: { equipe_id: equipeId ? Number(equipeId) : null, nome_membro: equipeId ? null : nome, funcao: $("pa-membro-funcao").value.trim() || null },
      });
      $("pa-membro-nome").value = "";
      $("pa-membro-funcao").value = "";
      await carregar();
      renderMembros();
    } catch (err) {
      erro.textContent = err.message;
      erro.hidden = false;
    }
  }

  async function cliqueMembros(e) {
    const b = e.target.closest("button[data-membro]");
    if (!b) return;
    try {
      await chamar(`/api/departamentos/${depAberto}/membros/${b.dataset.membro}`, { metodo: "DELETE" });
      await carregar();
      renderMembros();
    } catch (err) {
      $("pa-membros-erro").textContent = err.message;
      $("pa-membros-erro").hidden = false;
    }
  }
})();