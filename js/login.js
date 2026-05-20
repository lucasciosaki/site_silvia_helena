// Cadastro
document.querySelector('#cadastro-nome').closest('form').querySelector('button').addEventListener('click', async () => {
    const nome  = document.getElementById('cadastro-nome').value
    const email = document.getElementById('cadastro-email').value
    const senha = document.getElementById('cadastro-senha').value

    if (!nome || !email || !senha) {
        alert('Preencha todos os campos.')
        return
    }

    try {
        const res = await fetch('/api/auth/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        })

        const data = await res.json()

        if (!res.ok) {
            alert(data.erro || 'Erro ao cadastrar.')
            return
        }

        alert('Cadastro realizado! Agora faça login.')

    } catch (err) {
        alert('Erro de conexão com o servidor.')
    }
})

// Login
document.querySelector('#login-email').closest('form').querySelector('button').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value
    const senha = document.getElementById('login-senha').value

    if (!email || !senha) {
        alert('Preencha todos os campos.')
        return
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        })

        const data = await res.json()

        if (!res.ok) {
            alert(data.erro || 'Erro ao fazer login.')
            return
        }

        // salva o token e os dados do usuário no localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('usuario', JSON.stringify(data.usuario))

        // redireciona conforme o tipo de usuário
        if (data.usuario.isAdmin) {
            window.location.href = './adm.html'
        } else {
            window.location.href = './agendamento.html'
        }

    } catch (err) {
        alert('Erro de conexão com o servidor.')
    }
})  