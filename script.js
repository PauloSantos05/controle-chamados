let chamados = [];
let id = 1;
let resultadosBusca = null; // Guarda os resultados da busca atual (para controlar botões)
let ordemAtual = { coluna: null, crescente: true };

// Ajuste a senha de admin aqui
const SENHA_ADMIN = "admin123";

// ========== LOCAL STORAGE ==========
function salvarChamadosLocal() {
  localStorage.setItem('chamados', JSON.stringify(chamados));
  localStorage.setItem('proximoId', id);
}

// Carrega chamados ao iniciar a página
if (localStorage.getItem('chamados')) {
  chamados = JSON.parse(localStorage.getItem('chamados'));
  id = parseInt(localStorage.getItem('proximoId')) || (chamados.length ? Math.max(...chamados.map(c=>c.id)) + 1 : 1);
}

// ========== FUNÇÃO DATA ==========
function dataAgora() {
  const d = new Date();
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

// ========== MODAIS ==========
document.getElementById("btn-criar").onclick = function() {
  document.getElementById("modal-criacao").style.display = "block";
};
document.getElementById("fechar-modal-criacao").onclick = function() {
  document.getElementById("modal-criacao").style.display = "none";
};
document.getElementById("btn-buscar").onclick = function() {
  document.getElementById("modal-busca").style.display = "block";
};
document.getElementById("fechar-modal-busca").onclick = function() {
  document.getElementById("modal-busca").style.display = "none";
};
document.getElementById("fechar-modal").onclick = function() {
  document.getElementById("modal-edicao").style.display = "none";
};
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) event.target.style.display = "none";
};

// ========== CADASTRO DE CHAMADO ==========
document.getElementById("form-chamado").addEventListener("submit", function(event) {
  event.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const prioridade = document.getElementById("prioridade").value;
  const status = "Aberto";
  const dataCriacao = dataAgora();

  if (!titulo || !descricao || !prioridade) {
    mostrarMensagem("Preencha todos os campos.", true);
    return;
  }

  chamados.push({
    id: id++,
    titulo,
    descricao,
    prioridade,
    status,
    dataCriacao,
    dataModificacao: dataCriacao
  });
  salvarChamadosLocal();
  atualizarTabela(chamados);
  this.reset();
  mostrarMensagem("Chamado registrado com sucesso!", false);
  document.getElementById("modal-criacao").style.display = "none";
  resultadosBusca = null;
});

// ========== ORDENAÇÃO ==========
function ordenarChamados(lista, coluna, crescente = true) {
  const sorted = [...lista].sort((a, b) => {
    if (coluna === "id") {
      return crescente ? a.id - b.id : b.id - a.id;
    }
    if (coluna === "dataCriacao" || coluna === "dataModificacao") {
      // Datas estão no formato DD/MM/YYYY HH:MM
      const [dA, mA, aA, hA, minA] = a[coluna].split(/[\s/:]/);
      const [dB, mB, aB, hB, minB] = b[coluna].split(/[\s/:]/);
      const dateA = new Date(`${aA}-${mA}-${dA}T${hA}:${minA}:00`);
      const dateB = new Date(`${bB}-${mB}-${dB}T${hB}:${minB}:00`);
      return crescente ? dateA - dateB : dateB - dateA;
    }
    // Para texto (titulo, status, prioridade)
    const valA = (a[coluna] || '').toLowerCase();
    const valB = (b[coluna] || '').toLowerCase();
    if (valA < valB) return crescente ? -1 : 1;
    if (valA > valB) return crescente ? 1 : -1;
    return 0;
  });
  return sorted;
}

// ========== TABELA PRINCIPAL ==========
function atualizarTabela(lista = chamados) {
  const tbody = document.querySelector("#tabela-chamados tbody");
  tbody.innerHTML = "";

  // Visual: destaca o cabeçalho ordenado e mostra seta
  document.querySelectorAll("#tabela-chamados th[data-coluna]").forEach(th => {
    th.classList.remove("ordenado");
    th.removeAttribute("data-ordem");
  });
  if (ordemAtual.coluna) {
    const th = document.querySelector(`#tabela-chamados th[data-coluna="${ordemAtual.coluna}"]`);
    if (th) {
      th.classList.add("ordenado");
      th.setAttribute("data-ordem", ordemAtual.crescente ? "↑" : "↓");
    }
  }

  // Ordena se necessário
  let exibir = lista;
  if (ordemAtual.coluna) {
    exibir = ordenarChamados(exibir, ordemAtual.coluna, ordemAtual.crescente);
  }

  exibir.forEach(chamado => {
    let classePrioridade = "";
    if (chamado.prioridade === "Alta") classePrioridade = "prioridade-alta";
    else if (chamado.prioridade === "Média") classePrioridade = "prioridade-media";
    else if (chamado.prioridade === "Baixa") classePrioridade = "prioridade-baixa";

    let classeStatus = "";
    if (chamado.status === "Aberto") classeStatus = "status-aberto";
    else if (chamado.status === "Em Andamento") classeStatus = "status-andamento";
    else if (chamado.status === "Finalizado") classeStatus = "status-finalizado";

    // Tooltip com quebra de linha
    const descricaoTooltip = chamado.descricao
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${chamado.id}</td>
      <td>
        <span class="tooltip titulo-link" style="color:#007bff;cursor:pointer;text-decoration:underline;">
          ${chamado.titulo}
          <span class="tooltip-text">${descricaoTooltip}</span>
        </span>
      </td>
      <td class="${classePrioridade}">${chamado.prioridade}</td>
      <td class="${classeStatus}">${chamado.status}</td>
      <td>${chamado.dataCriacao}</td>
      <td>${chamado.dataModificacao}</td>
      <td>
        <button class="btn-deletar" data-id="${chamado.id}" title="Deletar chamado"
          style="background:none;color:#e74c3c;border:none;padding:6px 12px;font-size:1.25em;cursor:pointer;">
          🗑️
        </button>
      </td>

    `;
    tr.querySelector('.titulo-link').onclick = () => abrirModalEdicao(chamado.id);
    tbody.appendChild(tr);
  });

  // EVENTO DE DELETAR COM SENHA DE ADMIN
  tbody.querySelectorAll(".btn-deletar").forEach(btn => {
    btn.onclick = function() {
      const chamadoId = parseInt(btn.getAttribute("data-id"));
      // Solicita senha de admin
      const senha = prompt("Digite a senha de administrador para deletar o chamado:");
      if (senha !== null) {
        if (senha === SENHA_ADMIN) {
          if (confirm("Tem certeza que deseja deletar este chamado? Esta ação não pode ser desfeita.")) {
            chamados = chamados.filter(c => c.id !== chamadoId);
            if (resultadosBusca) resultadosBusca = resultadosBusca.filter(c => c.id !== chamadoId);
            salvarChamadosLocal();
            atualizarTabela(resultadosBusca !== null ? resultadosBusca : chamados);
            mostrarMensagem("Chamado deletado com sucesso!");
          }
        } else {
          alert("Senha incorreta. Ação cancelada.");
        }
      }
    };
  });
}

// ========== ADICIONA EVENTOS DE ORDEM NOS CABEÇALHOS ==========
document.querySelectorAll("#tabela-chamados th[data-coluna]").forEach(th => {
  th.style.cursor = "pointer";
  th.onclick = function() {
    const coluna = th.getAttribute("data-coluna");
    if (ordemAtual.coluna === coluna) {
      ordemAtual.crescente = !ordemAtual.crescente; // alterna a ordem
    } else {
      ordemAtual.coluna = coluna;
      ordemAtual.crescente = true;
    }
    atualizarTabela(resultadosBusca !== null ? resultadosBusca : chamados);
  }
});

// ========== MODAL DE EDIÇÃO ==========
function abrirModalEdicao(chamadoId) {
  const modal = document.getElementById("modal-edicao");
  const chamado = chamados.find(c => c.id === chamadoId);

  document.getElementById("edit-id").value = chamado.id;
  document.getElementById("edit-titulo").value = chamado.titulo;
  document.getElementById("edit-descricao").value = chamado.descricao;
  document.getElementById("edit-prioridade").value = chamado.prioridade;
  document.getElementById("edit-status").value = chamado.status;

  modal.style.display = "block";
}

document.getElementById("form-edicao").onsubmit = function(e) {
  e.preventDefault();
  const editId = parseInt(document.getElementById("edit-id").value);
  const editTitulo = document.getElementById("edit-titulo").value.trim();
  const editDescricao = document.getElementById("edit-descricao").value.trim();
  const editPrioridade = document.getElementById("edit-prioridade").value;
  const editStatus = document.getElementById("edit-status").value;

  if (!editTitulo || !editDescricao || !editPrioridade || !editStatus) {
    mostrarMensagem("Preencha todos os campos.", true);
    return;
  }

  const chamado = chamados.find(c => c.id === editId);
  chamado.titulo = editTitulo;
  chamado.descricao = editDescricao;
  chamado.prioridade = editPrioridade;
  chamado.status = editStatus;
  chamado.dataModificacao = dataAgora();

  salvarChamadosLocal();
  atualizarTabela(resultadosBusca !== null ? resultadosBusca : chamados);
  document.getElementById("modal-edicao").style.display = "none";
  mostrarMensagem("Chamado atualizado com sucesso!", false);
};

// ========== BUSCA AVANÇADA ==========
document.getElementById("form-busca").onsubmit = function(e) {
  e.preventDefault();
  const idBusca = document.getElementById("busca-id").value;
  const tituloBusca = document.getElementById("busca-titulo").value.toLowerCase().trim();
  const prioridadeBusca = document.getElementById("busca-prioridade").value;
  const statusBusca = document.getElementById("busca-status").value;

  let resultados = chamados.filter(c => {
    return (
      (!idBusca || c.id === parseInt(idBusca)) &&
      (!tituloBusca || c.titulo.toLowerCase().includes(tituloBusca)) &&
      (!prioridadeBusca || c.prioridade === prioridadeBusca) &&
      (!statusBusca || c.status === statusBusca)
    );
  });
  atualizarTabela(resultados);
  resultadosBusca = resultados;
  document.getElementById("modal-busca").style.display = "none";

  document.getElementById("limpar-busca").style.display =
    (idBusca || tituloBusca || prioridadeBusca || statusBusca) ? "block" : "none";
};

// ========== BOTÃO LIMPAR BUSCA EXTERNO (sempre visível) ==========
document.getElementById("limpar-busca-externo").onclick = function() {
  document.getElementById("form-busca").reset();
  resultadosBusca = null;
  atualizarTabela(chamados);
  document.getElementById("limpar-busca").style.display = "none";
};

// ========== BOTÃO LIMPAR BUSCA INTERNO (MODAL) ==========
document.getElementById("limpar-busca").onclick = function() {
  document.getElementById("form-busca").reset();
  resultadosBusca = null;
  atualizarTabela(chamados);
  document.getElementById("limpar-busca").style.display = "none";
  document.getElementById("modal-busca").style.display = "none";
};

// ========== MENSAGEM DE STATUS ==========
function mostrarMensagem(texto, erro = false) {
  const msgDiv = document.getElementById("mensagem");
  msgDiv.textContent = texto;
  msgDiv.style.color = erro ? "red" : "green";
  setTimeout(() => msgDiv.textContent = "", 3000);
}

// ========== TOOLTIP RESPONSIVO ==========
document.addEventListener("mouseover", function(e) {
  const t = e.target.closest('.tooltip');
  if (t && t.querySelector('.tooltip-text')) {
    t.classList.add('show');
    const tooltipBox = t.querySelector('.tooltip-text');
    tooltipBox.style.left = "50%";
    tooltipBox.style.right = "auto";
    tooltipBox.style.transform = "translateX(-50%)";
    const rect = tooltipBox.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    if (rect.right > viewportWidth) {
      tooltipBox.style.left = "auto";
      tooltipBox.style.right = "0";
      tooltipBox.style.transform = "none";
    }
    if (rect.left < 0) {
      tooltipBox.style.left = "0";
      tooltipBox.style.right = "auto";
      tooltipBox.style.transform = "none";
    }
  }
});
document.addEventListener("mouseout", function(e) {
  const t = e.target.closest('.tooltip');
  if (t && t.querySelector('.tooltip-text')) {
    t.classList.remove('show');
  }
});

// ========== INICIALIZAÇÃO ==========
atualizarTabela(chamados);
