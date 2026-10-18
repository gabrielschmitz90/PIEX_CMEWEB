
(() => {
    const form = document.getElementById("loginForm");

    if (!form) return;

    const campoUsuario = document.getElementById("usuario");
    const campoSenha = document.getElementById("senha");
    const mensagem = document.getElementById("loginMensagem");
    const botao = document.getElementById("btnEntrar");

    function mostrarMensagem(texto, erro = true) {
        mensagem.textContent = texto;
        mensagem.hidden = !texto;
        mensagem.style.color = erro ? "#b42318" : "#16794b";
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
