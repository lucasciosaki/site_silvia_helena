let dataAtual = new Date();
let selecaoTemporaria = { dataChave: null, hora: null, horarioId: null, dia: null, mes: null };

const token = localStorage.getItem('token')

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

    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const divDia = document.createElement('div');
        divDia.className = 'dia';
        divDia.innerText = dia;
        divDia.onclick = () => selecionarDia(dia, mes, ano);
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

async function renderizarAgendamentosMarcados() {
    const listaUI = document.getElementById('lista-agendamentos')
    listaUI.innerHTML = ''

    try {
        const res = await fetch('/api/adm/agendamentos', {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const agendamentos = await res.json()

        if (!agendamentos.length) {
            listaUI.innerHTML = '<p>Nenhum agendamento ainda.</p>'
            return
        }

        agendamentos.forEach(item => {
            const data = item.Horario.data.split('-').reverse().slice(0, 2).join('/')
            const hora = item.Horario.hora.slice(0, 5)

            const card = document.createElement('div')
            card.className = 'agendamento-card'
            card.innerHTML = `<span><strong>${data} às ${hora}</strong></span>`
            listaUI.appendChild(card)
        })

    } catch (err) {
        listaUI.innerHTML = '<p>Erro ao carregar agendamentos.</p>'
    }
}

window.onload = renderizarAgendamentosMarcados