// Exibe campo de avaliação por estrelas quando status for 'Lido'
function exibirAvaliacao() {
  const status = document.getElementById('status').value;
  const group = document.getElementById('avaliacaoGroup');
  if (status === 'Lido') {
    group.classList.remove('hidden');
    renderEstrelas();
  } else {
    group.classList.add('hidden');
  }
}

// Renderiza estrelas de avaliação (1 a 5)
function renderEstrelas(valor = 0) {
  const container = document.getElementById('avaliacaoEstrelas');
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const estrela = document.createElement('span');
    estrela.className = 'estrela' + (i <= valor ? ' ativa' : '');
    estrela.innerHTML = '&#9733;';
    estrela.style.fontSize = '2rem';
    estrela.style.cursor = 'pointer';
    estrela.style.color = i <= valor ? '#FFD700' : '#ccc';
    estrela.onclick = () => {
      renderEstrelas(i);
      document.getElementById('avaliacaoEstrelas').setAttribute('data-valor', i);
    };
    container.appendChild(estrela);
  }
}

// Função para alternar tema no mobile/tablet
function toggleThemeMobile() {
  document.body.classList.toggle('dark');
  const iconDesktop = document.querySelector('#btnToggleTheme i');
  const iconMobile = document.querySelector('#btnToggleThemeMobile i');
  if (document.body.classList.contains('dark')) {
    if (iconDesktop) iconDesktop.className = 'fas fa-sun';
    if (iconMobile) iconMobile.className = 'fas fa-sun';
    const user = window.getFirebaseUser();
    if (user) window.firebaseSetUserTheme(user.uid, 'dark');
  } else {
    if (iconDesktop) iconDesktop.className = 'fas fa-moon';
    if (iconMobile) iconMobile.className = 'fas fa-moon';
    const user = window.getFirebaseUser();
    if (user) window.firebaseSetUserTheme(user.uid, 'light');
  }
}

// app.js - Lógica JS para Minha Biblioteca Premium
// Variáveis globais
let editandoIndex = null;
let filtroAtual = "Todos";
let modalIndex = null;
// Elementos DOM
const lista = document.getElementById("listaLivros");
const formulario = document.getElementById("formulario");
const metaSection = document.getElementById("metaSection");
const modal = document.getElementById("modal");
const filterMenu = document.getElementById("filterMenu"); // Novo elemento para o menu de filtro

// Definição global para evitar erro de função não encontrada
window.getFirebaseUser = function() {
  return window.firebaseUser || null;
};

// Inicialização ao carregar a página
// Funções utilitárias Firebase Firestore
window.firebaseDb = null;
window.firebaseCollectionLivros = null;
window.firebaseCollectionMetas = null;

// Inicializa Firestore e coleções após login
window.initFirebaseCollections = function(firebaseApp, firebaseUser) {
  const { getFirestore, collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where } = window.firebaseModules;
  window.firebaseDb = getFirestore(firebaseApp);
  window.firebaseCollectionLivros = collection(window.firebaseDb, 'livros');
  window.firebaseCollectionMetas = collection(window.firebaseDb, 'metas');
  window.firebaseUser = firebaseUser;
};

// LIVROS
window.firebaseGetLivros = async function() {
  const { getDocs, query, where } = window.firebaseModules;
  const user = window.getFirebaseUser();
  if (!user) return [];
  const q = query(window.firebaseCollectionLivros, where('uid', '==', user.uid));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
window.firebaseAddLivro = async function(livro) {
  const { addDoc } = window.firebaseModules;
  const user = window.getFirebaseUser();
  if (!user) return;
  return addDoc(window.firebaseCollectionLivros, { ...livro, uid: user.uid });
};
window.firebaseUpdateLivro = async function(docId, livro) {
  const { updateDoc, doc } = window.firebaseModules;
  return updateDoc(doc(window.firebaseDb, 'livros', docId), livro);
};
window.firebaseDeleteLivro = async function(docId) {
  const { deleteDoc, doc } = window.firebaseModules;
  return deleteDoc(doc(window.firebaseDb, 'livros', docId));
};

// METAS
window.firebaseSetMeta = async function(docId, meta) {
  const { setDoc, doc } = window.firebaseModules;
  return setDoc(doc(window.firebaseDb, 'metas', docId), meta);
};
window.firebaseGetMeta = async function(docId) {
  const { doc } = window.firebaseModules;
  const metaDoc = doc(window.firebaseDb, 'metas', docId);
  const snap = await window.firebaseModules.getDoc(metaDoc);
  return snap.exists() ? snap.data() : null;
};

// TEMA DO USUÁRIO
window.firebaseSetUserTheme = async function(uid, theme) {
  const { setDoc, doc } = window.firebaseModules;
  return setDoc(doc(window.firebaseDb, 'temas', uid), { theme });
};
window.firebaseGetUserTheme = async function(uid) {
  const { doc } = window.firebaseModules;
  const themeDoc = doc(window.firebaseDb, 'temas', uid);
  const snap = await window.firebaseModules.getDoc(themeDoc);
  return snap.exists() ? snap.data().theme : 'light';
};

document.addEventListener('DOMContentLoaded', function() {
  // Adiciona log para depuração
  console.log('DOMContentLoaded: Iniciando app.js');
  carregarTema();
  // Firebase Firestore: aguarda usuário logado para carregar livros
  if (window.getFirebaseUser()) {
    console.log('Usuário logado:', window.getFirebaseUser());
    carregarLivros();
  } else {
    console.warn('Nenhum usuário logado. Exibindo alerta.');
    mostrarAlerta('Nenhum usuário logado. Faça login para acessar sua biblioteca.', 'error');
  }
});

// Função para rolar ao topo ao abrir formulários/modais
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filtrar(status) {
  filtroAtual = status;
  carregarLivros();
  // Fechar o menu de filtro após selecionar uma opção (se estiver aberto)
  if (!filterMenu.classList.contains('hidden')) {
    toggleFilterMenu();
  }
}

function mostrarAlerta(mensagem, tipo) {
  let alerta = document.createElement('div');
  alerta.textContent = mensagem;
  alerta.style.position = 'fixed';
  alerta.style.top = '20px';
  alerta.style.left = '50%';
  alerta.style.transform = 'translateX(-50%)';
  alerta.style.padding = '16px 32px';
  alerta.style.borderRadius = '12px';
  alerta.style.zIndex = '2000';
  alerta.style.color = 'white';
  alerta.style.fontWeight = 'bold';
  alerta.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
  alerta.style.background = tipo === 'error' ? '#ef4444' : '#10b981';
  document.body.appendChild(alerta);
  setTimeout(() => alerta.remove(), 2500);
}

function atualizarAbas(status) {
  // Lógica para abas desktop
  const tabs = document.querySelectorAll('.tabs-container .tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  if (status === 'Todos') document.getElementById('tabTodos').classList.add('active');
  if (status === 'Quero ler') document.getElementById('tabQueroLer').classList.add('active');
  if (status === 'Lendo') document.getElementById('tabLendo').classList.add('active');
  if (status === 'Lido') document.getElementById('tabLido').classList.add('active');

  // Lógica para o botão de filtro mobile (opcional, para indicar o filtro atual)
  const btnFilterMenu = document.getElementById('btnFilterMenu');
  if (btnFilterMenu) {
    // Você pode adicionar uma classe ou mudar o texto/ícone para indicar o filtro ativo
    // Por exemplo, mudar a cor do ícone ou adicionar um pequeno badge
  }
}

function abrirModal(index) {
  const livros = window.livrosCache || [];
  const livro = livros[index];
  if (!livro) return;
  modalIndex = index;
  document.getElementById('modalTitulo').textContent = livro.titulo;
  document.getElementById('modalAutor').textContent = livro.autor;
  document.getElementById('modalAno').textContent = livro.ano;
  document.getElementById('modalPaginas').textContent = livro.paginas;
  document.getElementById('modalStatus').textContent = livro.status;
  document.getElementById('modalPaginasLidas').textContent = livro.paginasLidas;
  document.getElementById('modalMeta').textContent = livro.inMeta ? livro.metaAnoLivro : '-';
  // Exibe avaliação por estrelas se existir
  let estrelasHtml = '';
  if (livro.status === 'Lido' && livro.avaliacao) {
    for (let i = 1; i <= 5; i++) {
      estrelasHtml += `<span class='estrela${i <= livro.avaliacao ? ' ativa' : ''}' style='font-size:1.5rem;color:${i <= livro.avaliacao ? '#FFD700' : '#ccc'};'>&#9733;</span>`;
    }
    estrelasHtml = `<div style='margin:8px 0;'>${estrelasHtml}</div>`;
  }
  const sinopseEl = document.getElementById('modalSinopse');
  sinopseEl.innerHTML = (estrelasHtml ? estrelasHtml : '') + `<div>${livro.sinopse}</div>`;
  sinopseEl.classList.add('book-sinopse');
  document.getElementById('btnLerMais').style.display = livro.sinopse.length > 300 ? 'block' : 'none';
  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  modalIndex = null;
}

function editarLivroModal() {
  if (modalIndex === null) return;
  const livros = window.livrosCache || [];
  const livro = livros[modalIndex];
  if (!livro) return;
  editandoIndex = modalIndex;
  document.getElementById('titulo').value = livro.titulo;
  document.getElementById('autor').value = livro.autor;
  document.getElementById('ano').value = livro.ano;
  document.getElementById('paginas').value = livro.paginas;
  document.getElementById('paginasLidas').value = livro.paginasLidas;
  document.getElementById('capa').value = livro.capa;
  document.getElementById('sinopse').value = livro.sinopse;
  document.getElementById('status').value = livro.status;
  document.getElementById('inMeta').checked = livro.inMeta;
  document.getElementById('metaAnoLivro').value = livro.metaAnoLivro;
  fecharModal();
  abrirFormulario();
}

function lerMaisSinopse() {
  const livros = window.livrosCache || [];
  if (modalIndex === null) return;
  const livro = livros[modalIndex];
  if (!livro) return;
  const sinopseEl = document.getElementById('modalSinopse');
  sinopseEl.textContent = livro.sinopse;
  sinopseEl.classList.remove('book-sinopse');
  document.getElementById('btnLerMais').style.display = 'none';
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const icon = document.querySelector('#btnToggleTheme i');
  if (document.body.classList.contains('dark')) {
    icon.className = 'fas fa-sun';
    const user = window.getFirebaseUser();
    if (user) window.firebaseSetUserTheme(user.uid, 'dark');
  } else {
    icon.className = 'fas fa-moon';
    const user = window.getFirebaseUser();
    if (user) window.firebaseSetUserTheme(user.uid, 'light');
  }
}

function carregarTema() {
  const user = window.getFirebaseUser();
  if (!user) return;
  window.firebaseGetUserTheme(user.uid).then(theme => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      const themeBtn = document.getElementById('btnToggleTheme');
      if (themeBtn) {
        const icon = themeBtn.querySelector('i');
        icon.className = 'fas fa-sun';
      }
    } else {
      document.body.classList.remove('dark');
      const themeBtn = document.getElementById('btnToggleTheme');
      if (themeBtn) {
        const icon = themeBtn.querySelector('i');
        icon.className = 'fas fa-moon';
      }
    }
  });
}

function abrirFormulario() {
  formulario.classList.remove("hidden");
  metaSection.classList.add("hidden");
  document.getElementById("formTitulo").textContent = editandoIndex !== null ? "Editar Livro" : "Adicionar Livro";
  scrollToTop();
}

function fecharFormulario() {
  formulario.classList.add("hidden");
  limparFormulario();
  editandoIndex = null;
}

function limparFormulario() {
  document.getElementById("titulo").value = "";
  document.getElementById("autor").value = "";
  document.getElementById("ano").value = "";
  document.getElementById("paginas").value = "";
  document.getElementById("paginasLidas").value = "";
  document.getElementById("capa").value = "";
  document.getElementById("sinopse").value = "";
  document.getElementById("status").value = "Quero ler";
  document.getElementById("inMeta").checked = false;
  document.getElementById("metaAnoLivro").value = "";
}

function abrirMeta() {
  formulario.classList.add("hidden");
  metaSection.classList.remove("hidden");
  carregarMeta();
  scrollToTop();
}

function salvarMeta() {
  const ano = document.getElementById("metaAno").value;
  const total = document.getElementById("metaTotalInput").value;
  if (!ano || !total) {
    mostrarAlerta("Preencha o ano e a quantidade de livros!", "error");
    return;
  }
  // Firebase Firestore: salva meta anual por usuário e ano
  const user = window.getFirebaseUser();
  if (!user) {
    mostrarAlerta("Faça login para salvar meta!", "error");
    return;
  }
  const db = window.firebaseDb;
  const metasRef = window.firebaseCollectionMetas;
  const metaDocId = `${user.uid}_${ano}`;
  window.firebaseSetMeta(metaDocId, { ano, total, uid: user.uid }).then(() => {
    metaSection.classList.add("hidden");
    carregarLivros();
    mostrarAlerta("Meta salva com sucesso!", "success");
  });
}

function carregarMeta() {
  const currentYear = new Date().getFullYear();
  const user = window.getFirebaseUser();
  if (!user) {
    document.getElementById("metaAno").value = currentYear;
    document.getElementById("metaTotalInput").value = 12;
    return;
  }
  const ano = document.getElementById("metaAno").value || currentYear;
  const metaDocId = `${user.uid}_${ano}`;
  window.firebaseGetMeta(metaDocId).then(meta => {
    document.getElementById("metaAno").value = meta?.ano || currentYear;
    document.getElementById("metaTotalInput").value = meta?.total || 12;
  });
}

function salvarLivro() {
  const titulo = document.getElementById("titulo").value.trim();
  const autor = document.getElementById("autor").value.trim();
  const ano = Number(document.getElementById("ano").value);
  const paginas = Number(document.getElementById("paginas").value);
  const paginasLidas = Number(document.getElementById("paginasLidas").value) || 0;
  const capa = document.getElementById("capa").value.trim();
  const status = document.getElementById("status").value;
  const inMeta = document.getElementById("inMeta").checked;
  const metaAnoLivro = document.getElementById("metaAnoLivro").value || ano;
  const sinopse = document.getElementById("sinopse").value.trim();
  if (!titulo || !autor) {
    mostrarAlerta("Preencha o título e o autor do livro!", "error");
    return;
  }
  if (ano < 0 || paginas < 0 || paginasLidas < 0) {
    mostrarAlerta("Ano, páginas e páginas lidas não podem ser negativos!", "error");
    return;
  }
  if (paginasLidas > paginas) {
    mostrarAlerta("Páginas lidas não pode ser maior que o total de páginas!", "error");
    return;
  }
  const avaliacao = document.getElementById('avaliacaoEstrelas').getAttribute('data-valor') || null;
  const novoLivro = {
    titulo,
    autor,
    ano,
    paginas,
    paginasLidas,
    capa: capa || 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/91e31048-ca4a-4f80-9a4a-4605443c847c.png',
    status,
    inMeta,
    metaAnoLivro,
    sinopse,
    avaliacao: status === 'Lido' ? Number(avaliacao) : null
  };
  // Firebase Firestore
  const user = window.getFirebaseUser();
  if (!user) {
    mostrarAlerta("Faça login para salvar livros!", "error");
    return;
  }
  const db = window.firebaseDb;
  const livrosRef = window.firebaseCollectionLivros;
  if (editandoIndex !== null && window.livrosCache && window.livrosCache[editandoIndex]) {
    // Atualizar livro existente
    const docId = window.livrosCache[editandoIndex].id;
    window.firebaseUpdateLivro(docId, novoLivro).then(() => {
      mostrarAlerta("Livro atualizado com sucesso!", "success");
      fecharFormulario();
      carregarLivros();
    });
  } else {
    // Adicionar novo livro
    window.firebaseAddLivro(novoLivro).then(() => {
      mostrarAlerta("Livro adicionado com sucesso!", "success");
      fecharFormulario();
      carregarLivros();
    });
  }
}

function carregarLivros() {
  try {
    // Firebase Firestore
    const user = window.getFirebaseUser();
    if (!user) return;
    const db = window.firebaseDb;
    const livrosRef = window.firebaseCollectionLivros;
    lista.innerHTML = "";
    window.firebaseGetLivros().then(livros => {
      window.livrosCache = livros;
      const metaAno = document.getElementById("metaAno").value || new Date().getFullYear();
      const metaTotal = Number(document.getElementById("metaTotalInput").value || 12);
      let contLidoAno = 0;
      let countTodos = livros.length;
      let countQueroLer = 0;
      let countLendo = 0;
      let countLido = 0;
      livros.forEach(l => {
        if (l.status === "Lido" && l.inMeta && l.metaAnoLivro == metaAno) {
          contLidoAno++;
        }
        if (l.status === "Quero ler") countQueroLer++;
        if (l.status === "Lendo") countLendo++;
        if (l.status === "Lido") countLido++;
      });
      document.getElementById("badgeTodos").textContent = countTodos;
      document.getElementById("badgeQueroLer").textContent = countQueroLer;
      document.getElementById("badgeLendo").textContent = countLendo;
      document.getElementById("badgeLido").textContent = countLido;
      document.getElementById("metaAnoDisplay").textContent = metaAno;
      document.getElementById("metaContador").textContent = contLidoAno;
      document.getElementById("metaTotalDisplay").textContent = metaTotal;
      const perc = Math.min(100, Math.round((contLidoAno / metaTotal) * 100));
      setTimeout(() => {
        document.getElementById("metaBar").style.width = perc + "%";
      }, 50);
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
          <div class="book-progress">
            <div class="book-progress-fill"></div>
          </div>
          <div class="book-info">
            <div class="book-title">${l.titulo}</div>
            <div class="book-author">${l.autor}</div>
            <span class="book-status status-${l.status.toLowerCase().replace(' ', '-')}" >${l.status}</span>
            ${estrelasHtml}
          </div>
        `;
        // Corrige o progresso da barra
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

// Nova função para alternar a visibilidade do menu de filtro
function toggleFilterMenu() {
  filterMenu.classList.toggle('hidden');
}

// Fechar o menu de filtro se clicar fora dele
document.addEventListener('click', function(event) {
  const btnFilterMenu = document.getElementById('btnFilterMenu');
  if (filterMenu && !filterMenu.classList.contains('hidden') &&
      !filterMenu.contains(event.target) && !btnFilterMenu.contains(event.target)) {
    filterMenu.classList.add('hidden');
  }
});
