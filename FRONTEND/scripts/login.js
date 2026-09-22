document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Evita que a página recarregue

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, senha })
        });

        if (resposta.ok) {
            alert('Login realizado com sucesso!');
            // Redireciona para o painel administrativo
            window.location.href = '../painel-admin.html';
        } else {
            const erro = await resposta.json();
            alert(erro.erro || 'Utilizador ou palavra-passe inválidos.');
        }
    } catch (erro) {
        console.error('Erro na ligação ao servidor:', erro);
        alert('Não foi possível estabelecer ligação com o servidor.');
    }
});