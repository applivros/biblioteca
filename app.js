
// ==============================
// Funções principais do App.js
// ==============================

console.log("DOMContentLoaded: Iniciando app.js");

let filtroAtual = "Todos";
let lista = document.getElementById("listaLivros");

// ==============================
// Função robusta para atualizar abas
// ==============================
function atualizarAbas(status) {
  const tabTodos = document.getElementById('tabTodos');
  const tabQueroLer = document.getElementById('tabQueroLer');
  const tabLendo = document.getElementById('tabLendo');
  const tabLido = document.getElementById('tabLido');

  if (!tabTodos || !tabQueroLer || !tabLendo || !tabLido) {
    console.warn("Abas não renderizadas ainda. Tentando novamente...");
    setTimeout(() => atualizarAbas(status), 200);
    return;
  }

  document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));

  if (status === 'Todos') tabTodos.classList.add('active');
  if (status === 'Quero ler') tabQueroLer.classList.add('active');
  if (status === 'Lendo') tabLendo.classList.add('active');
  if (status === 'Lido') tabLido.classList.add('active');
}

// ==============================
// Carregar livros do Firebase
// ==============================
function carregarLivros() {
  if (!document.getElementById('tabTodos')) {
    setTimeout(carregarLivros, 100);
    return;
  }

  try {
    const user = window.getFirebaseUser();
    if (!user) {
      console.warn("Nenhum usuário logado. Exibindo alerta.");
      return;
    }
    lista.innerHTML = "";

    window.firebaseGetLivros().then(livros => {
      window.livrosCache = livros;

      const metaAnoEl = document.getElementById("metaAno");
      const metaTotalEl = document.getElementById("metaTotalInput");
      const metaAno = metaAnoEl ? metaAnoEl.value : new Date().getFullYear();
      const metaTotal = metaTotalEl ? Number(metaTotalEl.value) : 12;

      let contLidoAno = 0;
      let countTodos = livros.length;
      let countQueroLer = 0;
      let countLendo = 0;
      let countLido = 0;

      livros.forEach(l => {
        if (l.status === "Lido" && l.inMeta && l.metaAnoLivro == metaAno) contLidoAno++;
        if (l.status === "Quero ler") countQueroLer++;
        if (l.status === "Lendo") countLendo++;
        if (l.status === "Lido") countLido++;
      });

      const badgeTodos = document.getElementById("badgeTodos");
      const badgeQueroLer = document.getElementById("badgeQueroLer");
      const badgeLendo = document.getElementById("badgeLendo");
      const badgeLido = document.getElementById("badgeLido");
      const metaAnoDisplay = document.getElementById("metaAnoDisplay");
      const metaContador = document.getElementById("metaContador");
      const metaTotalDisplay = document.getElementById("metaTotalDisplay");
      const metaBar = document.getElementById("metaBar");

      if (badgeTodos) badgeTodos.textContent = countTodos;
      if (badgeQueroLer) badgeQueroLer.textContent = countQueroLer;
      if (badgeLendo) badgeLendo.textContent = countLendo;
      if (badgeLido) badgeLido.textContent = countLido;
      if (metaAnoDisplay) metaAnoDisplay.textContent = metaAno;
      if (metaContador) metaContador.textContent = contLidoAno;
      if (metaTotalDisplay) metaTotalDisplay.textContent = metaTotal;

      const perc = Math.min(100, Math.round((contLidoAno / metaTotal) * 100));
      setTimeout(() => { if (metaBar) metaBar.style.width = perc + "%"; }, 50);

      atualizarAbas(filtroAtual);

      if (livros.length === 0) {
        lista.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
            <i class="fas fa-book-open" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <h3>Sua biblioteca está vazia</h3>
            <p>Adicione seu primeiro livro clicando no botão +</p>
          </div>
        `;
        return;
      }

      livros.slice().reverse().forEach((l, revIndex) => {
        const indexReal = livros.length - 1 - revIndex;
        if (filtroAtual !== "Todos" && l.status !== filtroAtual) return;

        const progresso = l.paginas > 0 ? Math.min(100, Math.round((l.paginasLidas / l.paginas) * 100)) : 0;
        let estrelasHtml = '';

        if (l.status === 'Lido' && l.avaliacao) {
          for (let i = 1; i <= 5; i++) {
            estrelasHtml += `<span class='estrela${i <= l.avaliacao ? ' ativa' : ''}' style='font-size:1.1rem;color:${i <= l.avaliacao ? '#FFD700' : '#ccc'};'>&#9733;</span>`;
          }
          estrelasHtml = `<div class='avaliacao-lista' style='margin:4px 0 0 0;'>${estrelasHtml}</div>`;
        }

        const div = document.createElement("div");
        div.className = "book-card fade-in";
        div.innerHTML = `
          <img src="${l.capa}" alt="Capa do livro: ${l.titulo}" class="book-cover"
               onerror="this.src='https://placehold.co/200x300/4f46e5/white?text=📚'">
          <div class="book-progress"><div class="book-progress-fill"></div></div>
          <div class="book-info">
            <div class="book-title">${l.titulo}</div>
            <div class="book-author">${l.autor}</div>
            <span class="book-status status-${l.status.toLowerCase().replace(' ', '-')}" >${l.status}</span>
            ${estrelasHtml}
          </div>
        `;

        const progressFill = div.querySelector('.book-progress-fill');
        if (progressFill) progressFill.style.width = progresso + '%';

        div.onclick = () => abrirModal(indexReal);
        lista.appendChild(div);
      });
    });
  } catch (e) {
    mostrarAlerta('Erro ao carregar livros: ' + e.message, 'error');
    console.error(e);
  }
}

// ==============================
// Firebase init collections
// ==============================
window.initFirebaseCollections = function(firebaseApp, firebaseUser) {
  const { getFirestore, collection } = window.firebaseModules;
  window.firebaseDb = getFirestore(firebaseApp);
  window.firebaseCollectionLivros = collection(window.firebaseDb, 'livros');
  window.firebaseCollectionMetas = collection(window.firebaseDb, 'metas');
  window.firebaseUser = firebaseUser;
};
