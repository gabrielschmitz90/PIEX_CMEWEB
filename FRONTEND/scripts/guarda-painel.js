// Protege o painel-admin.html: sem login válido, volta para a tela de login.
// Carregue depois do api.js.
(async () => {
  const voltar = () => {
    Auth.limpar();
    window.location.href = "login/login.html";
  };
  if (!Auth.token()) return voltar();
  try {
    window.cmeUsuario = await api("/api/me"); // usuário logado (id, usuario, nome, perfil)
    document.dispatchEvent(new CustomEvent("cme:autenticado", { detail: window.cmeUsuario }));
  } catch (err) {
    if (err.status === 401) voltar();
  }
})();

function sairDoPainel() {
  Auth.limpar();
  window.location.href = "login/login.html";
}