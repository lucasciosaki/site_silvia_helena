let dataAtual = new Date();
let selecaoTemporaria = { dataChave: null, hora: null, horarioId: null, dia: null, mes: null };

const token = localStorage.getItem('token')
const usuario = JSON.parse(localStorage.getItem('usuario'))
const isAdmin = usuario && usuario.isAdmin

// redireciona pra login se não estiver logado
if (!token) {
    window.location.href = './login.html'
}

window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

function renderizarCalendario() {
    const diasGrid = document.getElementById('dias-grid');
    const mesAnoTexto = document.getElementById('mes-ano-texto');
    diasGrid.innerHTML = '';

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    mesAnoTexto.innerText = `${nomesMeses[mes]} ${ano}`;

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) {
        const vazio = document.createElement('div');
        vazio.className = 'dia dia--vazio';
        diasGrid.appendChild(vazio);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const divDia = document.createElement('div');
        divDia.className = 'dia';
        divDia.innerText = dia;

        const dataComparacao = new Date(ano, mes, dia);

        if (dataComparacao < hoje) {
            divDia.classList.add('dia--passado');
        } else {
            divDia.onclick = () => selecionarDia(dia, mes, ano);
        }
        diasGrid.appendChild(divDia);
    }
}

function selecionarDia(dia, mes, ano) {
    document.querySelectorAll('.dia').forEach(d => d.classList.remove('dia--selecionado'));
    event.target.classList.add('dia--selecionado');

    const diaFormatado = String(dia).padStart(2, '0');
    const mesFormatado = String(mes + 1).padStart(2, '0');
    const dataChave = `${ano}-${mesFormatado}-${diaFormatado}`;

    atualizarPainelHorarios(dataChave, dia, mes + 1);
}

async function atualizarPainelHorarios(dataChave, dia, mes) {
    const container = document.getElementById('lista-botoes-horas');
    const painel = document.getElementById('painel-horarios');
    const display = document.getElementById('dia-selecionado');
    const confirmarBox = document.getElementById('confirmar-box');

    container.innerHTML = '<p>Carregando horários...</p>';
    confirmarBox.classList.add('hidden');
    painel.classList.remove('hidden');
    display.innerText = `${dia}/${mes}`;

    try {
        const res = await fetch(`/api/agenda/${dataChave}`)
        const horarios = await res.json()

        container.innerHTML = ''

        if (horarios.length === 0) {
            container.innerHTML = '<p>Nenhum horário aberto pela terapeuta para este dia.</p>'
            return
        }

        horarios.forEach(horario => {
            const btn = document.createElement('button')
            btn.className = 'btn-hora'
            btn.innerText = horario.hora.slice(0, 5) // exibe só HH:MM

            btn.onclick = () => {
                selecaoTemporaria = {
                    dataChave,
                    hora: horario.hora.slice(0, 5),
                    horarioId: horario.id,
                    dia,
                    mes
                }

                document.querySelectorAll('.btn-hora').forEach(b => b.classList.remove('btn-hora--selecionado'))
                btn.classList.add('btn-hora--selecionado')
                confirmarBox.classList.remove('hidden')
            }

            container.appendChild(btn)
        })

    } catch (err) {
        container.innerHTML = '<p>Erro ao carregar horários.</p>'
    }
}

document.getElementById('prev-mes').onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderizarCalendario();
};

document.getElementById('next-mes').onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderizarCalendario();
};

renderizarCalendario();

document.getElementById('btn-final').onclick = async function () {
    const { horarioId, hora, dia, mes } = selecaoTemporaria

    try {
        const res = await fetch('/api/agenda/reservar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ horarioId })
        })

        const data = await res.json()

        if (!res.ok) {
            alert(data.erro || 'Erro ao reservar.')
            return
        }

        alert(`Sucesso! Horário das ${hora} reservado.`)

        document.getElementById('confirmar-box').classList.add('hidden')
        document.getElementById('painel-horarios').classList.add('hidden')
        renderizarCalendario()
        renderizarAgendamentosMarcados()

    } catch (err) {
        alert('Erro de conexão com o servidor.')
    }
}

async function cancelarAgendamento(id) {
    if (!confirm('Deseja realmente cancelar este agendamento?')) {
        return
    }

    try {
        const res = await fetch(`/api/agenda/cancelar/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const data = await res.json()

        if (!res.ok) {
            alert(data.erro || 'Erro ao cancelar agendamento.')
            return
        }

        alert('Agendamento cancelado com sucesso!')
        renderizarAgendamentosMarcados()
        renderizarCalendario()

    } catch (err) {
        alert('Erro de conexão com o servidor.')
    }
}

async function renderizarAgendamentosMarcados() {
    const listaUI = document.getElementById('lista-agendamentos')
    listaUI.innerHTML = ''

    try {
        const url = isAdmin ? '/api/adm/agendamentos' : '/api/agenda/meus-agendamentos'
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const agendamentos = await res.json()

        if (!agendamentos.length) {
            listaUI.innerHTML = isAdmin
                ? '<p>Nenhum agendamento marcado no sistema.</p>'
                : '<p>Você não possui agendamentos marcados.</p>'
            return
        }

        // Ordena por data e hora na memória
        agendamentos.sort((a, b) => {
            if (a.Horario.data !== b.Horario.data) {
                return a.Horario.data.localeCompare(b.Horario.data)
            }
            return a.Horario.hora.localeCompare(b.Horario.hora)
        })

        agendamentos.forEach(item => {
            const data = item.Horario.data.split('-').reverse().slice(0, 2).join('/')
            const hora = item.Horario.hora.slice(0, 5)

            const card = document.createElement('div')
            card.className = 'agendamento-card'

            // Para o admin, colocamos o flex-direction column para organizar melhor a info do cliente
            if (isAdmin) {
                card.style.flexDirection = 'column'
                card.style.gap = '8px'
                card.style.alignItems = 'flex-start'
            }

            // Div que segura as infos do card
            const infoDiv = document.createElement('div')
            infoDiv.style.display = 'flex'
            infoDiv.style.flexDirection = 'column'
            infoDiv.style.gap = '4px'

            const timeSpan = document.createElement('span')
            timeSpan.innerHTML = `<strong>${data} às ${hora}</strong>`
            infoDiv.appendChild(timeSpan)

            // Se for admin, mostra os detalhes do cliente
            if (isAdmin && item.Usuario) {
                const userDiv = document.createElement('div')
                userDiv.style.fontSize = '0.9rem'
                userDiv.style.color = '#4b5563'
                userDiv.innerHTML = `Cliente: <strong>${item.Usuario.nome}</strong> (${item.Usuario.email})`
                infoDiv.appendChild(userDiv)

                if (item.observacao) {
                    const obsDiv = document.createElement('div')
                    obsDiv.style.fontSize = '0.85rem'
                    obsDiv.style.color = '#7c2d12'
                    obsDiv.style.fontStyle = 'italic'
                    obsDiv.textContent = `Obs: "${item.observacao}"`
                    infoDiv.appendChild(obsDiv)
                }
            }

            card.appendChild(infoDiv)

            const btn = document.createElement('button')
            btn.className = 'btn-cancelar'
            btn.textContent = 'Cancelar'
            btn.setAttribute('aria-label', `Cancelar agendamento do dia ${data} às ${hora}`)
            btn.onclick = () => cancelarAgendamento(item.id)

            // Ajusta o botão se for admin para alinhar à direita ou em baixo de forma flex
            if (isAdmin) {
                btn.style.alignSelf = 'flex-end'
            }

            card.appendChild(btn)
            listaUI.appendChild(card)
        })

    } catch (err) {
        listaUI.innerHTML = '<p>Erro ao carregar agendamentos.</p>'
    }
}

window.onload = renderizarAgendamentosMarcados