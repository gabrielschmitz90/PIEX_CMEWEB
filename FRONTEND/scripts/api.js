// Onde está a API?
// - Site aberto pelo Live Server (127.0.0.1:5500...) ou direto do arquivo: a API é a local (porta 8000).
// - Site servido pela própria API (porta 8000, túnel ou servidor hospedado): mesma origem, caminho relativo.
// Para forçar outro endereço, defina window.CME_API_URL antes de carregar este arquivo.
const _emDesenvolvimento =
  location.protocol === "file:" ||
  ((location.hostname === "127.0.0.1" || location.hostname === "localhost") && location.port !== "8000");
const API_URL = window.CME_API_URL || (_emDesenvolvimento ? "http://127.0.0.1:8000" : "");

const Auth = {
  token: () => sessionStorage.getItem("cme_token"),
  salvar: (token, usuario) => {
    sessionStorage.setItem("cme_token", token);
    sessionStorage.setItem("cme_usuario", JSON.stringify(usuario));
  },
  limpar: () => {
    sessionStorage.removeItem("cme_token");
    sessionStorage.removeItem("cme_usuario");
  },
};

async function api(caminho, { metodo = "GET", corpo, auth = true } = {}) {
  const headers = {};
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  if (auth && Auth.token()) headers["Authorization"] = "Bearer " + Auth.token();

  let resp;
  try {
    resp = await fetch(API_URL + caminho, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error("Não foi possível conectar à API. Ela está rodando?");
  }
  if (resp.status === 204) return null;

  const dados = await resp.json().catch(() => null);
  if (!resp.ok) {
    const detalhe = dados && dados.detail;
    const erro = new Error(typeof detalhe === "string" ? detalhe : "Dados inválidos (erro " + resp.status + ")");
    erro.status = resp.status;
    throw erro;
  }
  return dados;
}