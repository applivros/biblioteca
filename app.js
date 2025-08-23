// app.js - Lógica JS para Minha Biblioteca Premium + Autenticação Firebase
// Import Firebase (versão modular) via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração Firebase (fornecida)
const firebaseConfig = {
  apiKey: "AIzaSyAGcrW9JyAGM3nf4eHdtXaVozJOrKx8e-s",
  authDomain: "applivro-75c5b.firebaseapp.com",
  projectId: "applivro-75c5b",
  storageBucket: "applivro-75c5b.firebasestorage.app",
  messagingSenderId: "196142073774",
  appId: "1:196142073774:web:b1d953b7c633049c9a2a3f",
  measurementId: "G-T7P5KPE9P4"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
// Analytics é opcional em ambiente local; proteja contra erro em contextos sem suporte
try { getAnalytics(app); } catch (e) { /* ignore */ }

// Auth & DB
const auth = getAuth(app);
const db = getFirestore(app);

// ----------------------
// VARIÁVEIS/DOM EXISTENTES
// ----------------------
let editandoIndex = null;
let filtroAtual = "Todos";
let modalIndex = null;

const lista = document.getElementById("listaLivros");
const formulario = document.getElementById("formulario");
const metaSection = document.getElementById("metaSection");
const modal = document.getElementById("modal");
const filterMenu = document.getElementById("filterMenu");

// ----------------------
// UI: ALERTA/HELPERS
// ----------------------
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

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------
// AUTENTICAÇÃO
// ----------------------
window.toggleAuthMode = function toggleAuthMode() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm.classList.contains("hidden")) {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  }
};

window.registrar = async function registrar() {
  const nome = document.getElementById("regNome").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const senha = document.getElementById("regPassword").value;
  const nascimento = document.getElementById("regNascimento").value;
  const sexo = document.getElementById("regSexo").value;

  if (!nome || !email || !senha || !nascimento) {
    mostrarAlerta("Preencha todos os campos!", "error");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const user = cred.user;

    // Atualiza o displayName para uso no app
    try { await updateProfile(user, { displayName: nome }); } catch (e) {}

    // Salva extras no Firestore
    await setDoc(doc(db, "usuarios", user.uid), {
      nome,
      email,
      nascimento,
      sexo,
      criadoEm: new Date().toISOString()
    });

    mostrarAlerta("Conta criada com sucesso! Faça login para continuar.", "success");
    toggleAuthMode();
  } catch (err) {
    mostrarAlerta(err.message, "error");
  }
};

window.login = async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginPassword").value;

  if (!email || !senha) {
    mostrarAlerta("Informe email e senha!", "error");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    mostrarAlerta("Login realizado com sucesso!", "success");
  } catch (err) {
    mostrarAlerta("Erro ao logar: " + err.message, "error");
  }
};

window.logout = async function logout() {
  try {
    await signOut(auth);
    mostrarAlerta("Sessão encerrada!", "success");
  } catch (e) {
    mostrarAlerta("Não foi possível sair.", "error");
  }
};

// Controla visibilidade conforme estado de login
onAuthStateChanged(auth, (user) => {
  const appContainer = document.querySelector(".app-container");
  const authSection = document.getElementById("authSection");

  if (user) {
    authSection.classList.add("hidden");
    appContainer.style.display = "block";
    // Carrega UI do app autenticado
    carregarTema();
    carregarLivros();
  } else {
    appContainer.style.display = "none";
    authSection.classList.remove("hidden");
  }
});

// ----------------------
// FUNÇÕES DO APP (originais)
// ----------------------
document.addEventListener('DOMContentLoaded', function() {
  // O carregamento do tema e livros é chamado ao logar (onAuthStateChanged)
});

function filtrar(status) {
  filtroAtual = status;
  carregarLivros();
  if (!filterMenu.classList.contains('hidden')) {
    toggleFilterMenu();
  }
}

function atualizarAbas(status) {
  const tabs = document.querySelectorAll('.tabs-container .tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  if (status === 'Todos') document.getElementById('tabTodos').classList.add('active');
  if (status === 'Quero ler') document.getElementById('tabQueroLer').classList.add('active');
  if (status === 'Lendo') document.getElementById('tabLendo').classList.add('active');
  if (status === 'Lido') document.getElementById('tabLido').classList.add('active');
}

window.abrirModal = function abrirModal(index) {
  const livros = JSON.parse(localStorage.getItem('livros')) || [];
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
  const sinopseEl = document.getElementById('modalSinopse');
  sinopseEl.textContent = livro.sinopse;
  sinopseEl.classList.add('book-sinopse');
  document.getElementById('btnLerMais').style.display = livro.sinopse && livro.sinopse.length > 300 ? 'block' : 'none';
  document.getElementById('modal').classList.add('show');
};

window.fecharModal = function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  modalIndex = null;
};

window.editarLivroModal = function editarLivroModal() {
  if (modalIndex === null) return;
  const livros = JSON.parse(localStorage.getItem('livros')) || [];
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
};

window.lerMaisSinopse = function lerMaisSinopse() {
  const livros = JSON.parse(localStorage.getItem('livros')) || [];
  if (modalIndex === null) return;
  const livro = livros[modalIndex];
  if (!livro) return;
  const sinopseEl = document.getElementById('modalSinopse');
  sinopseEl.textContent = livro.sinopse;
  sinopseEl.classList.remove('book-sinopse');
  document.getElementById('btnLerMais').style.display = 'none';
};

window.toggleTheme = function toggleTheme() {
  document.body.classList.toggle('dark');
  const btn = document.querySelector('#btnToggleTheme i');
  if (document.body.classList.contains('dark')) {
    if (btn) btn.className = 'fas fa-sun';
    localStorage.setItem('theme', 'dark');
  } else {
    if (btn) btn.className = 'fas fa-moon';
    localStorage.setItem('theme', 'light');
  }
};

function carregarTema() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    const themeBtn = document.getElementById('btnToggleTheme');
    if (themeBtn) {
      const icon = themeBtn.querySelector('i');
      icon.className = 'fas fa-sun';
    }
  } else {
    document.body.classList.remove('dark');
  }
}

window.abrirFormulario = function abrirFormulario() {
  formulario.classList.remove("hidden");
  metaSection.classList.add("hidden");
  document.getElementById("formTitulo").textContent = editandoIndex !== null ? "Editar Livro" : "Adicionar Livro";
  scrollToTop();
};

window.fecharFormulario = function fecharFormulario() {
  formulario.classList.add("hidden");
  limparFormulario();
  editandoIndex = null;
};

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

window.abrirMeta = function abrirMeta() {
  formulario.classList.add("hidden");
  metaSection.classList.remove("hidden");
  carregarMeta();
  scrollToTop();
};

window.salvarMeta = function salvarMeta() {
  const ano = document.getElementById("metaAno").value;
  const total = document.getElementById("metaTotalInput").value;
  if (!ano || !total) {
    mostrarAlerta("Preencha o ano e a quantidade de livros!", "error");
    return;
  }
  localStorage.setItem("metaAno", ano);
  localStorage.setItem("metaTotal", total);
  metaSection.classList.add("hidden");
  carregarLivros();
  mostrarAlerta("Meta salva com sucesso!", "success");
};

function carregarMeta() {
  const currentYear = new Date().getFullYear();
  document.getElementById("metaAno").value = localStorage.getItem("metaAno") || currentYear;
  document.getElementById("metaTotalInput").value = localStorage.getItem("metaTotal") || 12;
}

window.salvarLivro = function salvarLivro() {
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
  const novoLivro = {
    titulo,
    autor,
    ano,
    paginas,
    paginasLidas,
    capa: capa || 'https://placehold.co/200x300/4f46e5/white?text=%F0%9F%93%9A',
    status,
    inMeta,
    metaAnoLivro,
    sinopse
  };
  const livros = JSON.parse(localStorage.getItem("livros")) || [];
  if (editandoIndex !== null) {
    livros[editandoIndex] = novoLivro;
    mostrarAlerta("Livro atualizado com sucesso!", "success");
  } else {
    livros.push(novoLivro);
    mostrarAlerta("Livro adicionado com sucesso!", "success");
  }
  localStorage.setItem("livros", JSON.stringify(livros));
  fecharFormulario();
  carregarLivros();
};

function carregarLivros() {
  const livros = JSON.parse(localStorage.getItem("livros")) || [];
  lista.innerHTML = "";
  const metaAno = localStorage.getItem("metaAno") || new Date().getFullYear();
  const metaTotal = Number(localStorage.getItem("metaTotal") || 12);
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
    const div = document.createElement("div");
    div.className = "book-card fade-in";
    div.innerHTML = `
      <img src="${l.capa}" alt="Capa do livro: ${l.titulo}" class="book-cover"
           onerror="this.src='https://placehold.co/200x300/4f46e5/white?text=%F0%9F%93%9A'">
      <div class="book-progress">
        <div class="book-progress-fill"></div>
      </div>
      <div class="book-info">
        <div class="book-title">${l.titulo}</div>
        <div class="book-author">${l.autor}</div>
        <span class="book-status status-${l.status.toLowerCase().replace(' ', '-')}" >${l.status}</span>
      </div>
    `;
    const progressFill = div.querySelector('.book-progress-fill');
    if (progressFill) progressFill.style.width = progresso + '%';
    div.onclick = () => abrirModal(indexReal);
    lista.appendChild(div);
  });
}

window.toggleFilterMenu = function toggleFilterMenu() {
  filterMenu.classList.toggle('hidden');
};

// Fecha menu de filtro ao clicar fora
document.addEventListener('click', function(event) {
  const btnFilterMenu = document.getElementById('btnFilterMenu');
  if (filterMenu && !filterMenu.classList.contains('hidden') &&
      !filterMenu.contains(event.target) && btnFilterMenu && !btnFilterMenu.contains(event.target)) {
    filterMenu.classList.add('hidden');
  }
});