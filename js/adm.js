const token = localStorage.getItem('token')
const usuario = JSON.parse(localStorage.getItem('usuario'))

// redireciona se não for admin
if (!token || !usuario || !usuario.isAdmin) {
    window.location.href = './login.html'
}

// ─── AGENDA ───────────────────────────────────────────────

document.getElementById('data-adm').addEventListener('change', renderizarListaAdm)

async function salvarAgenda() {
    const data = document.getElementById('data-adm').value
    const hora = document.getElementById('hora-adm').value

    if (!data || !hora) {
        alert('Selecione uma data e um horário.')
        return
    }

    try {
        const res = await fetch('/api/adm/horario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data, hora })
        })

        const result = await res.json()

        if (!res.ok) {
            alert(result.erro || 'Erro ao criar horário.')
            return
        }

        document.getElementById('hora-adm').value = ''
        renderizarListaAdm()

    } catch (err) {
        alert('Erro de conexão com o servidor.')
    }
}

async function excluirHorario(id) {
    try {
        const res = await fetch(`/api/adm/horario/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!res.ok) {
            alert('Erro ao remover horário.')
            return
        }

        renderizarListaAdm()

    } catch (err) {
        alert('Erro de conexão com o servidor.')
    }
}

function criarItemHorario(horario) {
    const li = document.createElement('li')

    // Contêiner para as informações do horário (esquerda)
    const infoDiv = document.createElement('div')
    infoDiv.className = 'horario-info'

    // Linha principal: hora + status básico
    const primaryRow = document.createElement('div')
    primaryRow.style.display = 'flex'
    primaryRow.style.alignItems = 'center'
    primaryRow.style.gap = '8px'

    const span = document.createElement('strong')
    span.textContent = horario.hora.slice(0, 5)
    primaryRow.appendChild(span)

    const status = document.createElement('span')
    status.textContent = horario.disponivel ? ' — disponível' : ' — reservado'
    status.style.color = horario.disponivel ? 'green' : 'gray'
    primaryRow.appendChild(status)
    infoDiv.appendChild(primaryRow)

    // Se o horário estiver reservado, exibe os detalhes do cliente (tratando variações de pluralização e caixa do Sequelize)
    const agendamentosList = horario.Agendamentos || horario.agendamentos || [];
    const agendamento = agendamentosList.length > 0
        ? agendamentosList[0]
        : (horario.Agendamento || horario.agendamento || null);
    const usuario = agendamento ? (agendamento.Usuario || agendamento.usuario) : null;

    if (!horario.disponivel && agendamento && usuario) {
        // Linha com nome e email do cliente
        const clientDetails = document.createElement('div')
        clientDetails.style.fontSize = '0.85rem'
        clientDetails.style.color = '#4b5563' // cinza escuro
        clientDetails.style.marginTop = '4px'
        clientDetails.style.fontWeight = 'normal'
        clientDetails.textContent = `Cliente: ${usuario.nome} (${usuario.email})`
        infoDiv.appendChild(clientDetails)

        // Se houver observações, exibe logo abaixo
        if (agendamento.observacao) {
            const obsDiv = document.createElement('div')
            obsDiv.style.fontSize = '0.8rem'
            obsDiv.style.color = '#7c2d12' // cor laranja/tijolo que combina com o tema quente
            obsDiv.style.marginTop = '2px'
            obsDiv.style.fontWeight = 'normal'
            obsDiv.style.fontStyle = 'italic'
            obsDiv.textContent = `Obs: "${agendamento.observacao}"`
            infoDiv.appendChild(obsDiv)
        }
    }

    const btn = document.createElement('button')
    btn.className = 'btn-remover'
    btn.textContent = 'Remover'
    btn.setAttribute('aria-label', `Remover horário das ${horario.hora}`)
    btn.onclick = () => excluirHorario(horario.id)

    li.appendChild(infoDiv)
    li.appendChild(btn)
    return li
}

async function renderizarListaAdm() {
    const data = document.getElementById('data-adm').value
    const lista = document.getElementById('lista-horarios-adm')
    const display = document.getElementById('data-display')

    lista.innerHTML = ''

    if (!data) return

    const [ano, mes, dia] = data.split('-')
    display.textContent = `${dia}/${mes}`

    try {
        const res = await fetch(`/api/adm/horarios/${data}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const horarios = await res.json()
        console.log('Horários recebidos (Admin):', horarios)

        if (horarios.length === 0) {
            const li = document.createElement('li')
            li.className = 'sem-horarios'
            li.textContent = 'Nenhum horário aberto para este dia.'
            lista.appendChild(li)
            return
        }

        horarios.forEach(h => lista.appendChild(criarItemHorario(h)))

    } catch (err) {
        lista.innerHTML = '<li>Erro ao carregar horários.</li>'
    }
}

// ─── MAPA PITAGÓRICO ──────────────────────────────────────

const selectCliente = document.getElementById('select-cliente')
const inputMapa   = document.getElementById('input-mapa')
// ... rest of selectors

async function carregarClientes() {
    if (!selectCliente) return

    try {
        const res = await fetch('/api/adm/usuarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!res.ok) return

        const usuarios = await res.json()
        
        // Mantém apenas a primeira opção (vazia) e adiciona os usuários
        selectCliente.innerHTML = '<option value="">Selecione o cliente...</option>'
        
        usuarios.forEach(u => {
            const opt = document.createElement('option')
            opt.value = u.email
            opt.textContent = `${u.nome} (${u.email})`
            selectCliente.appendChild(opt)
        })

    } catch (err) {
        console.error('Erro ao carregar clientes:', err)
    }
}

// Carrega a lista ao abrir a página
carregarClientes()

const uploadArea  = document.getElementById('upload-area')
const previewMapa = document.getElementById('preview-mapa')
const previewImg  = document.getElementById('preview-img')
const previewNome = document.getElementById('preview-nome')
const previewTam  = document.getElementById('preview-tamanho')
const feedbackDiv = document.getElementById('feedback-envio')
const feedbackMsg = document.getElementById('feedback-mensagem')

function formatarTamanho(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function exibirPreview(arquivo) {
    const reader = new FileReader()
    reader.onload = function (e) {
        previewImg.src = e.target.result
        previewNome.textContent = arquivo.name
        previewTam.textContent = formatarTamanho(arquivo.size)
        previewMapa.classList.remove('hidden')
    }
    reader.readAsDataURL(arquivo)
}

function limparPreview() {
    inputMapa.value = ''
    previewImg.src = ''
    previewNome.textContent = ''
    previewTam.textContent = ''
    previewMapa.classList.add('hidden')
}

inputMapa.addEventListener('change', function () {
    const arquivo = this.files[0]
    if (arquivo) exibirPreview(arquivo)
})

uploadArea.addEventListener('dragover', function (e) {
    e.preventDefault()
    this.classList.add('drag-over')
})

uploadArea.addEventListener('dragleave', function () {
    this.classList.remove('drag-over')
})

uploadArea.addEventListener('drop', function (e) {
    e.preventDefault()
    this.classList.remove('drag-over')

    const arquivo = e.dataTransfer.files[0]
    if (!arquivo) return

    const tiposPermitidos = ['image/jpeg', 'image/png']
    if (!tiposPermitidos.includes(arquivo.type)) {
        alert('Tipo de arquivo não suportado. Use .jpg ou .png.')
        return
    }

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(arquivo)
    inputMapa.files = dataTransfer.files
    exibirPreview(arquivo)
})

async function enviarMapa() {
    const selectCliente = document.getElementById('select-cliente')
    const arquivo = inputMapa.files[0]

    if (!selectCliente.value) {
        alert('Selecione um cliente antes de enviar.')
        return
    }

    if (!arquivo) {
        alert('Selecione uma imagem do mapa pitagórico.')
        return
    }

    const formData = new FormData()
    formData.append('mapa', arquivo)
    formData.append('emailCliente', selectCliente.value)

    try {
        const res = await fetch('/api/adm/mapa', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })

        const result = await res.json()

        if (!res.ok) {
            alert(result.erro || 'Erro ao enviar mapa.')
            return
        }

        feedbackMsg.textContent = `Mapa enviado com sucesso para ${selectCliente.value}!`
        feedbackDiv.classList.remove('hidden')
        selectCliente.value = ''
        limparPreview()
        setTimeout(() => feedbackDiv.classList.add('hidden'), 6000)

    } catch (err) {
        alert('Erro de conexão com o servidor.')
    }
}