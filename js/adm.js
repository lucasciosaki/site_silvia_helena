/*
   ADM.JS — Painel Administrativo de Agenda
   Gerencia a abertura e remoção de horários disponíveis para
   os pacientes. Os dados são persistidos em localStorage com
   a chave 'banco_agenda', compartilhada com agendamento.js.
*/

/* Lê a agenda do dia selecionado no localStorage */
function lerAgendaDoDia(data) {
    const agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};
    return agendaCompleta[data] || [];
}

/* Persiste a agenda completa no localStorage */
function salvarAgendaCompleta(agendaCompleta) {
    localStorage.setItem('banco_agenda', JSON.stringify(agendaCompleta));
}

/* Abre um novo horário para o dia selecionado */
function salvarAgenda() {
    const data = document.getElementById('data-adm').value;
    const hora = document.getElementById('hora-adm').value;

    if (!data || !hora) {
        alert('Por favor, selecione uma data e um horário.');
        return;
    }

    const agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};

    if (!agendaCompleta[data]) {
        agendaCompleta[data] = [];
    }

    // Evita duplicatas
    if (agendaCompleta[data].includes(hora)) {
        alert('Este horário já foi adicionado para este dia.');
        return;
    }

    agendaCompleta[data].push(hora);
    agendaCompleta[data].sort(); // Mantém a lista em ordem cronológica
    salvarAgendaCompleta(agendaCompleta);

    // Limpa o campo de hora após adicionar
    document.getElementById('hora-adm').value = '';

    renderizarListaAdm();
}

/* Remove um horário específico do dia selecionado
   A remoção é feita sem recarregar a página: apenas atualiza
   o DOM e o localStorage. */
function excluirHorario(hora) {
    const data = document.getElementById('data-adm').value;
    const agendaCompleta = JSON.parse(localStorage.getItem('banco_agenda')) || {};

    if (!agendaCompleta[data]) return;

    agendaCompleta[data] = agendaCompleta[data].filter(h => h !== hora);

    // Remove a chave da data se não restar nenhum horário
    if (agendaCompleta[data].length === 0) {
        delete agendaCompleta[data];
    }

    salvarAgendaCompleta(agendaCompleta);
    renderizarListaAdm();
}Site

/* Cria o elemento <li> para um horário disponível
   Separado em função própria para não misturar criação de DOM
   com lógica de renderização. */
function criarItemHorario(hora) {
    const li = document.createElement('li');

    const span = document.createElement('strong');
    span.textContent = hora;

    // Botão Remover: usa a classe .btn-remover definida em adm.css
    
    const btn = document.createElement('button');
    btn.className = 'btn-remover';
    btn.textContent = 'Remover';
    btn.setAttribute('aria-label', `Remover horário das ${hora}`);
    btn.onclick = () => excluirHorario(hora);

    li.appendChild(span);
    li.appendChild(btn);
    return li;
}

/* Atualiza a lista visual de horários do dia selecionado */
function renderizarListaAdm() {
    const data = document.getElementById('data-adm').value;
    const lista = document.getElementById('lista-horarios-adm');
    const display = document.getElementById('data-display');

    lista.innerHTML = '';

    if (!data) return;

    // Formata a data de YYYY-MM-DD para DD/MM
    const [ano, mes, dia] = data.split('-');
    display.textContent = `${dia}/${mes}`;

    const horarios = lerAgendaDoDia(data);

    if (horarios.length === 0) {
        const li = document.createElement('li');
        li.className = 'sem-horarios';
        li.textContent = 'Nenhum horário aberto para este dia.';
        lista.appendChild(li);
        return;
    }

    horarios.forEach(hora => {
        lista.appendChild(criarItemHorario(hora));
    });
}

/* Listener: atualiza a lista sempre que a data muda */
document.getElementById('data-adm').addEventListener('change', renderizarListaAdm);

/* Listener: botão "Abrir Horário" via atributo onclick no HTML
   A função salvarAgenda() é chamada pelo onclick do HTML. */


const inputMapa    = document.getElementById('input-mapa');
const uploadArea   = document.getElementById('upload-area');
const previewMapa  = document.getElementById('preview-mapa');
const previewImg   = document.getElementById('preview-img');
const previewNome  = document.getElementById('preview-nome');
const previewTam   = document.getElementById('preview-tamanho');
const feedbackDiv  = document.getElementById('feedback-envio');
const feedbackMsg  = document.getElementById('feedback-mensagem');

function formatarTamanho(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function exibirPreview(arquivo) {
    const reader = new FileReader();

    reader.onload = function (e) {
        previewImg.src = e.target.result;
        previewNome.textContent = arquivo.name;
        previewTam.textContent  = formatarTamanho(arquivo.size);
        previewMapa.classList.remove('hidden');
    };

    reader.readAsDataURL(arquivo);
}

function limparPreview() {
    inputMapa.value = '';
    previewImg.src  = '';
    previewNome.textContent = '';
    previewTam.textContent  = '';
    previewMapa.classList.add('hidden');
}

inputMapa.addEventListener('change', function () {
    const arquivo = this.files[0];
    if (arquivo) exibirPreview(arquivo);
});

uploadArea.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', function () {
    this.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', function (e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const arquivo = e.dataTransfer.files[0];
    if (!arquivo) return;

    const tiposPermitidos = ['image/jpeg', 'image/png'];
    if (!tiposPermitidos.includes(arquivo.type)) {
        alert('Tipo de arquivo não suportado. Use .jpg ou .png.');
        return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(arquivo);
    inputMapa.files = dataTransfer.files;

    exibirPreview(arquivo);
});

function enviarMapa() {
    const selectCliente = document.getElementById('select-cliente');
    const arquivo       = inputMapa.files[0];

    if (!selectCliente.value) {
        alert('Por favor, selecione um cliente antes de enviar.');
        return;
    }

    if (!arquivo) {
        alert('Por favor, selecione uma imagem do mapa pitagórico.');
        return;
    }

    const nomeCliente = selectCliente.options[selectCliente.selectedIndex].text;

    console.log('╔══ ENVIO DE MAPA PITAGÓRICO ══╗');
    console.log('  Cliente :', nomeCliente);
    console.log('  Arquivo :', arquivo.name);
    console.log('  Tamanho :', formatarTamanho(arquivo.size));
    console.log('  Tipo    :', arquivo.type);
    console.log('╚══════════════════════════════╝');

    mostrarFeedbackEnvio(nomeCliente, arquivo.name);
}

function mostrarFeedbackEnvio(nomeCliente, nomeArquivo) {
    feedbackMsg.textContent = `Mapa "${nomeArquivo}" enviado com sucesso para ${nomeCliente}!`;
    feedbackDiv.classList.remove('hidden');

    document.getElementById('select-cliente').value = '';
    limparPreview();

    setTimeout(() => feedbackDiv.classList.add('hidden'), 6000);
}
