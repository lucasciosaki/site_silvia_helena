let dataAtual = new Date();
let selecaoTemporaria = { dataChave: null, hora: null, dia: null, mes: null };

window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  
  if (window.scrollY > 30) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

function renderizarCalendario() {
    const diasGrid = document.getElementById('dias-grid');
    const mesAnoTexto = document.getElementById('mes-ano-texto');
    diasGrid.innerHTML = ""; 

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    mesAnoTexto.innerText = `${nomesMeses[mes]} ${ano}`;

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) {
        const vazio = document.createElement('div');
        vazio.className = 'dia vazio';
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
    document.querySelectorAll('.dia').forEach(d => d.classList.remove('selecionado'));
    event.target.classList.add('selecionado');

    const diaFormatado = String(dia).padStart(2, '0');
    const mesFormatado = String(mes + 1).padStart(2, '0'); 
    const dataChave = `${ano}-${mesFormatado}-${diaFormatado}`;

    atualizarPainelHorarios(dataChave, dia, mes + 1);
}

function atualizarPainelHorarios(dataChave, dia, mes) {
    const container = document.getElementById('lista-botoes-horas');
    const painel = document.getElementById('painel-horarios');
    const display = document.getElementById('dia-selecionado');
    const confirmarBox = document.getElementById('confirmar-box');
    
    container.innerHTML = ""; 
    confirmarBox.classList.add('hidden');

    let agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};

    let horariosDisponiveis = agendaCompleta[dataChave];

    if (horariosDisponiveis && horariosDisponiveis.length > 0) {
        horariosDisponiveis.forEach(hora => {
            const btn = document.createElement('button');
            btn.className = 'btn-hora';
            btn.innerText = hora;

            btn.onclick = () => {
                selecaoTemporaria = { dataChave, hora, dia, mes };

                document.querySelectorAll('.btn-hora').forEach(b => b.classList.remove('selecionado'));
                btn.classList.add('selecionado');
                confirmarBox.classList.remove('hidden');
            }
            
            container.appendChild(btn);
        });
        painel.classList.remove('hidden');
    } else {
        container.innerHTML = "<p>Nenhum horário aberto pela terapeuta para este dia.</p>";
        painel.classList.remove('hidden');
    }

    display.innerText = `${dia}/${mes}`;
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

document.getElementById('btn-final').onclick = function() {
    const nome = 'Paciente';
    const { dataChave, hora, dia, mes } = selecaoTemporaria;

    let agendamentos = JSON.parse(localStorage.getItem('banco_agendamentos')) || {};
    if (!agendamentos[dataChave]) agendamentos[dataChave] = [];
    agendamentos[dataChave].push({ hora: hora, cliente: nome });
    localStorage.setItem('banco_agendamentos', JSON.stringify(agendamentos));

    let agenda = JSON.parse(localStorage.getItem('banco_agenda')) || {};
    if (agenda[dataChave]) {
        agenda[dataChave] = agenda[dataChave].filter(h => h !== hora);
        localStorage.setItem('banco_agenda', JSON.stringify(agenda));
    }

    alert(`Sucesso! Horário das ${hora} reservado.`);

    document.getElementById('confirmar-box').classList.add('hidden');
    renderizarCalendario(); 
    document.getElementById('painel-horarios').classList.add('hidden');

    renderizarAgendamentosMarcados();
};

function renderizarAgendamentosMarcados() {
    const listaUI = document.getElementById('lista-agendamentos');
    listaUI.innerHTML = "";
    
    const marcados = JSON.parse(localStorage.getItem('banco_agendamentos')) || {};

    for (const data in marcados) {
        marcados[data].forEach(item => {
            const dataFormatada = data.split('-').reverse().slice(0, 2).join('/');
            
            const card = document.createElement('div');
            card.className = "confirmar-box";
            card.innerHTML = `<span><strong>${dataFormatada} às ${item.hora}</strong> - ${item.cliente}</span>`;
            listaUI.appendChild(card);
        });
    }
}

window.onload = renderizarAgendamentosMarcados;
