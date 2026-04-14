function salvarAgenda() {
    const data = document.getElementById('data-adm').value;
    const hora = document.getElementById('hora-adm').value;

    if (!data || !hora) {
        alert("Por favor, selecione data e hora.");
        return;
    }

    let agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};

    if (!agendaCompleta[data]) {
        agendaCompleta[data] = [];
    }

    if (!agendaCompleta[data].includes(hora)) {
        agendaCompleta[data].push(hora);
        agendaCompleta[data].sort();
        localStorage.setItem('banco_agenda', JSON.stringify(agendaCompleta));
    }

    renderizarListaAdm();
}

function excluirHorario(hora) {
    const data = document.getElementById('data-adm').value;
    let agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};

    agendaCompleta[data] = agendaCompleta[data].filter(h => h !== hora);

    localStorage.setItem('banco_agenda', JSON.stringify(agendaCompleta));
    renderizarListaAdm();
}

function renderizarListaAdm() {
    const data = document.getElementById('data-adm').value;
    const lista = document.getElementById('lista-horarios-adm');
    const display = document.getElementById('data-display');
    
    lista.innerHTML = "";

    if (!data) return;

    const partes = data.split("-");
    display.innerText = `${partes[2]}/${partes[1]}`;

    let agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};
    
    if (agendaCompleta[data] && agendaCompleta[data].length > 0) {
        agendaCompleta[data].forEach(h => {
            lista.innerHTML += `
                <li>
                    <strong>${h}</strong>
                    <button onclick="excluirHorario('${h}')" style="color:red; border:none; background:none; cursor:pointer;">Remover</button>
                </li>`;
        });
    } else {
        lista.innerHTML = "<li>Nenhum horário aberto para este dia.</li>";
    }
}

document.getElementById('data-adm').addEventListener('change', renderizarListaAdm);