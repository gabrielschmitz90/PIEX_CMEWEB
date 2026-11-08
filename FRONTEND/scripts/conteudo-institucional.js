// Dados públicos da equipe e dos departamentos (rotas sem autenticação).
(() => {
  if (typeof api !== "function") return;

  const criar = (tag, texto, classe) => {
    const elemento = document.createElement(tag);
    if (texto) elemento.textContent = texto;
    if (classe) elemento.className = classe;
    return elemento;
  };

  function secaoDa(legenda) {
    const titulo = [...document.querySelectorAll("h2")].find((h2) => h2.textContent.trim().replace(/:$/, "") === legenda);
    const grade = titulo?.parentElement.querySelector(".grid-3");
    if (!grade) return null;
    grade.replaceChildren();
    const status = criar("p", "Carregando...", "conteudo-status");
    status.style.cssText = "margin:20px 0;text-align:center;";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    grade.before(status);
    return { grade, status };
  }

  const equipe = secaoDa("Nossa Equipe");
  if (equipe) {
    api("/api/equipe", { auth: false }).then((membros) => {
      const dados = Array.isArray(membros) ? membros : [];
      equipe.grade.replaceChildren();
      equipe.status.textContent = dados.length ? "" : "As informações da equipe serão publicadas em breve.";
      dados.forEach((membro) => {
        const card = criar("article", null, "card");
        if (membro.foto) {
          const foto = criar("img");
          foto.src = API_URL + "/uploads/" + encodeURIComponent(membro.foto);
          foto.alt = "Foto de " + membro.nome;
          foto.loading = "lazy";
          foto.style.cssText = "width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 15px;";
          card.append(foto);
        } else {
          const avatar = criar("div");
          avatar.setAttribute("aria-hidden", "true");
          avatar.style.cssText = "width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));margin:0 auto 15px;";
          card.append(avatar);
        }
        const nome = criar("h3", membro.nome);
        nome.style.textAlign = "center";
        const cargo = criar("p", membro.cargo, "membro-cargo");
        cargo.style.cssText = "text-align:center;color:var(--color-primary);font-weight:bold;";
        const descricao = criar("p", membro.descricao || "");
        descricao.style.textAlign = "center";
        if (membro.descricao) card.append(nome, cargo, descricao);
        else card.append(nome, cargo);
        equipe.grade.append(card);
      });
    }).catch(() => { equipe.status.textContent = "Não foi possível carregar a equipe no momento."; });
  }

  const departamentos = secaoDa("Departamentos da Casa");
  if (departamentos) {
    api("/api/departamentos", { auth: false }).then((lista) => {
      const dados = Array.isArray(lista) ? lista : [];
      departamentos.grade.replaceChildren();
      departamentos.status.textContent = dados.length ? "" : "Os departamentos serão publicados em breve.";
      dados.forEach((departamento) => {
        const card = criar("article", null, "card");
        const avatar = criar("div");
        avatar.setAttribute("aria-hidden", "true");
        avatar.style.cssText = "width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));margin:0 auto 15px;";
        const nome = criar("h3", departamento.nome);
        nome.style.textAlign = "center";
        const responsavel = criar("p", departamento.responsavel ? "Responsável: " + departamento.responsavel : "", "membro-cargo");
        responsavel.style.cssText = "text-align:center;color:var(--color-primary);font-weight:bold;";
        const descricao = criar("p", departamento.descricao || "");
        card.append(avatar, nome);
        if (departamento.responsavel) card.append(responsavel);
        if (departamento.descricao) card.append(descricao);
        const membros = Array.isArray(departamento.membros) ? departamento.membros : [];
        if (membros.length) {
          const listaMembros = criar("ul");
          membros.forEach((membro) => {
            const item = criar("li", membro.funcao ? `${membro.nome} · ${membro.funcao}` : membro.nome);
            listaMembros.append(item);
          });
          card.append(listaMembros);
        }
        departamentos.grade.append(card);
      });
    }).catch(() => { departamentos.status.textContent = "Não foi possível carregar os departamentos no momento."; });
  }
})();
