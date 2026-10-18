document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const botao = form.querySelector("button[type=submit]");

  const aviso = document.createElement("p");
  aviso.style.cssText = "color:#c0392b;margin:0 0 12px;min-height:1em";
  form.insertBefore(aviso, botao);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    aviso.textContent = "";
    botao.disabled = true;
    botao.textContent = "Entrando...";
    try {
      const r = await api("/api/login", {
        metodo: "POST",
        auth: false,
        corpo: { usuario: form.usuario.value.trim(), senha: form.senha.value },
      });
      Auth.salvar(r.token, r.usuario);
      window.location.href = "../painel-admin.html";
    } catch (err) {
      aviso.textContent = err.message;
      botao.disabled = false;
      botao.textContent = "Entrar";
    }
  });
});