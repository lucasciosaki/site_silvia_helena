/* 
   AGENDAMENTO.JS
   Lógica do calendário e do fluxo de agendamento.
*/

let dataAtual = new Date();

// Armazena temporariamente a seleção do usuário antes de confirmar
let selecaoTemporaria = { dataChave: null, hora: null, dia: null, mes: null };

// Scroll suave: navbar muda de opacidade ao rolar a página
window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

/* Renderiza o calendário do mês atual */
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

    // Células vazias para alinhar o primeiro dia na coluna correta
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

/* Marca o dia clicado e exibe os horários disponíveis */
function selecionarDia(dia, mes, ano) {
    // Remove seleção anterior
    document.querySelectorAll('.dia').forEach(d => d.classList.remove('dia--selecionado'));
    event.target.classList.add('dia--selecionado'); 

    const diaFormatado = String(dia).padStart(2, '0');
    const mesFormatado = String(mes + 1).padStart(2, '0');
    const dataChave = `${ano}-${mesFormatado}-${diaFormatado}`;

    atualizarPainelHorarios(dataChave, dia, mes + 1);
}

/* Atualiza o painel lateral com os horários do dia selecionado */
function atualizarPainelHorarios(dataChave, dia, mes) {
    const container = document.getElementById('lista-botoes-horas');
    const painel = document.getElementById('painel-horarios');
    const display = document.getElementById('dia-selecionado');
    const confirmarBox = document.getElementById('confirmar-box');

    container.innerHTML = '';
    confirmarBox.classList.add('hidden');

    const agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};
    const horariosDisponiveis = agendaCompleta[dataChave];

    if (horariosDisponiveis && horariosDisponiveis.length > 0) {
        horariosDisponiveis.forEach(hora => {
            const btn = document.createElement('button');
            btn.className = 'btn-hora';
            btn.innerText = hora;

            btn.onclick = () => {
                selecaoTemporaria = { dataChave, hora, dia, mes };

                // Remove seleção anterior dos botões de hora
                document.querySelectorAll('.btn-hora').forEach(b => b.classList.remove('btn-hora--selecionado'));
                btn.classList.add('btn-hora--selecionado');

                confirmarBox.classList.remove('hidden');
            };

            container.appendChild(btn);
        });
    } else {
        container.innerHTML = '<p>Nenhum horário aberto pela terapeuta para este dia.</p>';
    }

    painel.classList.remove('hidden');
    display.innerText = `${dia}/${mes}`;
}

// Navegação entre meses
document.getElementById('prev-mes').onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderizarCalendario();
};

document.getElementById('next-mes').onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderizarCalendario();
};

// Inicializa o calendário ao carregar a página
renderizarCalendario();

/* Confirma o agendamento ao clicar em "Finalizar" */
document.getElementById('btn-final').onclick = function () {
    const nome = 'Paciente';
    const { dataChave, hora, dia, mes } = selecaoTemporaria;

    // Salva o agendamento confirmado
    const agendamentos = JSON.parse(localStorage.getItem('banco_agendamentos')) || {};
    if (!agendamentos[dataChave]) agendamentos[dataChave] = [];
    agendamentos[dataChave].push({ hora, cliente: nome });
    localStorage.setItem('banco_agendamentos', JSON.stringify(agendamentos));

    // Remove o horário da agenda disponível
    const agenda = JSON.parse(localStorage.getItem('banco_agenda')) || {};
    if (agenda[dataChave]) {
        agenda[dataChave] = agenda[dataChave].filter(h => h !== hora);
        localStorage.setItem('banco_agenda', JSON.stringify(agenda));
    }

    alert(`Sucesso! Horário das ${hora} reservado.`);

    document.getElementById('confirmar-box').classList.add('hidden');
    document.getElementById('painel-horarios').classList.add('hidden');
    renderizarCalendario();
    renderizarAgendamentosMarcados();
};

/* Renderiza a lista de todos os agendamentos confirmados */
function renderizarAgendamentosMarcados() {
    const listaUI = document.getElementById('lista-agendamentos');
    listaUI.innerHTML = '';

    const marcados = JSON.parse(localStorage.getItem('banco_agendamentos')) || {};

    for (const data in marcados) {
        marcados[data].forEach(item => {
            const dataFormatada = data.split('-').reverse().slice(0, 2).join('/');

            const card = document.createElement('div');
            card.className = 'agendamento-card'; // classe renomeada de 'confirmar-box'
            card.innerHTML = `<span><strong>${dataFormatada} às ${item.hora}</strong> - ${item.cliente}</span>`;
            listaUI.appendChild(card);
        });
    }
}

// Carrega agendamentos ao abrir a página
window.onload = renderizarAgendamentosMarcados;
