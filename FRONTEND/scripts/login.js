
(() => {
    const form = document.getElementById("loginForm");

    if (!form) return;

    const campoUsuario = document.getElementById("usuario");
    const campoSenha = document.getElementById("senha");
    const mensagem = document.getElementById("loginMensagem");
    const botao = document.getElementById("btnEntrar");
    const btnMostrarSenha = document.getElementById("btnMostrarSenha");

    function mostrarMensagem(texto, erro = true) {
        mensagem.textContent = texto;
        mensagem.hidden = !texto;
        mensagem.style.color = erro ? "#b42318" : "#16794b";
    }

    // Mostrar ou ocultar senha
    if (btnMostrarSenha) {
        btnMostrarSenha.addEventListener("click", () => {
            const mostrar = campoSenha.type === "password";

            campoSenha.type = mostrar ? "text" : "password";

            btnMostrarSenha.innerHTML = mostrar
                ? `
                    <svg viewBox="0 0 24 24" width="21" height="21"
                         fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round"
                         stroke-linejoin="round">
                        <path d="M3 3l18 18"/>
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-4 4.8"/>
                        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8"/>
                    </svg>
                `
                : `
                    <svg viewBox="0 0 24 24" width="21" height="21"
                         fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round"
                         stroke-linejoin="round">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                `;

            const textoBotao = mostrar ? "Ocultar senha" : "Mostrar senha";

            btnMostrarSenha.setAttribute("aria-label", textoBotao);
            btnMostrarSenha.title = textoBotao;
        });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        mostrarMensagem("");

        const usuario = campoUsuario.value.trim();
        const senha = campoSenha.value;

        if (!usuario || !senha) {
            mostrarMensagem("Informe o usuário e a senha.");
            return;
        }

        botao.disabled = true;
        botao.textContent = "Entrando...";

        try {
            const resposta = await api("/api/login", {
                metodo: "POST",
                corpo: {
                    usuario: usuario,
                    senha: senha
                },
                auth: false
            });

            if (
                !resposta ||
                !resposta.token ||
                !resposta.usuario
            ) {
                throw new Error(
                    "A resposta da API não contém os dados esperados."
                );
            }

            Auth.salvar(
                resposta.token,
                resposta.usuario
            );

            // Redireciona para o painel administrativo.
            window.location.href = "../painel-admin.html";

        } catch (erro) {
            if (erro.status === 401) {
                mostrarMensagem("Usuário ou senha inválidos.");
            } else if (erro.status === 429) {
                mostrarMensagem(
                    erro.message || "Muitas tentativas. Aguarde alguns minutos."
                );
            } else if (erro.status === 422) {
                mostrarMensagem(
                    "Confira os dados informados e tente novamente."
                );
            } else {
                mostrarMensagem(
                    erro.message || "Não foi possível realizar o login."
                );
            }

        } finally {
            botao.disabled = false;
            botao.textContent = "Entrar";
        }
    });
})();
