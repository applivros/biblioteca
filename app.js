// app.js - Lógica JS para Minha Biblioteca Premium

// Importar funções do Firebase SDK v9
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // Se você for usar Analytics

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAGcrW9JyAGM3nf4eHdtXaVozJOrKx8e-s",
  authDomain: "applivro-75c5b.firebaseapp.com",
  projectId: "applivro-75c5b",
  storageBucket: "applivro-75c5b.firebasestorage.app",
  messagingSenderId: "196142073774",
  appId: "1:196142073774:web:b1d953b7c633049c9a2a3f",
  measurementId: "G-T7P5KPE9P4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app); // Inicializa Analytics se necessário

// Variáveis globais
let editandoIndex = null; // Agora armazenará o ID do documento do livro
let filtroAtual = "Todos";
let modalIndex = null; // Agora armazenará o ID do documento do livro
let currentUser = null; // Para armazenar o usuário logado

// Elementos DOM
const lista = document.getElementById("listaLivros");
const formulario = document.getElementById("formulario");
const metaSection = document.getElementById("metaSection");
const modal = document.getElementById("modal");
const filterMenu = document.getElementById("filterMenu");
const loginSection = document.getElementById("loginSection"); // Novo
const mainApp = document.getElementById("mainApp"); // Novo

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  carregarTema(); // Carrega o tema antes de tudo
  // Observar o estado de autenticação
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      loginSection.classList.add('hidden');
      mainApp.classList.remove('hidden');
      carregarLivros(); // Carrega os livros do usuário logado
      carregarMeta(); // Carrega a meta do usuário logado
    } else {
      currentUser = null;
      loginSection.classList.remove('hidden');
      mainApp.classList.add('hidden');
      // Limpar a lista de livros e badges se não houver usuário logado
      lista.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
          <i class="fas fa-user-circle" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
          <h3>Faça login para ver sua biblioteca</h3>
          <p>Use o formulário acima para entrar ou criar uma conta.</p>
        </div>
      `;
      document.getElementById("badgeTodos").textContent = 0;
      document.getElementById("badgeQueroLer").textContent = 0;
      document.getElementById("badgeLendo").textContent = 0;
      document.getElementById("badgeLido").textContent = 0;
      document.getElementById("metaContador").textContent = 0;
      document.getElementById("metaTotalDisplay").textContent = 0;
      document.getElementById("metaBar").style.width = "0%";
    }
  });
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
  const tabs = document.querySelectorAll('.tabs-container .tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  if (status === 'Todos') document.getElementById('tabTodos').classList.add('active');
  if (status === 'Quero ler') document.getElementById('tabQueroLer').classList.add('active');
  if (status === 'Lendo') document.getElementById('tabLendo').classList.add('active');
  if (status === 'Lido') document.getElementById('tabLido').classList.add('active');
}

// Funções de Autenticação
// Registro personalizado com dados extras
async function customRegister() {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const birthdate = document.getElementById('registerBirthdate').value;
  const gender = document.getElementById('registerGender').value;
  const registerMessage = document.getElementById('registerMessage');

  if (!username || !email || !password || !birthdate || !gender) {
    registerMessage.textContent = "Preencha todos os campos.";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Salvar dados extras no Firestore
  await addDoc(collection(db, 'users'), {
      uid: user.uid,
      username,
      email,
      birthdate,
      gender
    });
    registerMessage.style.color = 'green';
    registerMessage.textContent = "Registro realizado com sucesso! Você já pode acessar sua biblioteca.";
    mostrarAlerta("Registro realizado com sucesso!", "success");
  } catch (error) {
    registerMessage.style.color = 'red';
    registerMessage.textContent = `Erro ao registrar: ${error.message}`;
  mostrarAlerta('Erro ao registrar: ' + error.message, "error");
  }
// ...existing code...
async function handleRegister() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const loginMessage = document.getElementById('loginMessage');
  console.log('Botão Registrar clicado');

  if (!email || !password) {
    loginMessage.textContent = "Por favor, preencha email e senha.";
    console.log('Campos de registro não preenchidos');
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    loginMessage.textContent = "Registro bem-sucedido! Você está logado.";
    mostrarAlerta("Registro bem-sucedido!", "success");
    console.log('Registro realizado com sucesso');
  } catch (error) {
    loginMessage.textContent = 'Erro ao registrar: ' + error.message;
    mostrarAlerta('Erro ao registrar: ' + error.message, "error");
    console.log('Erro ao registrar:', error);
  }

async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const loginMessage = document.getElementById('loginMessage');
  console.log('Botão Login clicado');

  if (!email || !password) {
    loginMessage.textContent = "Por favor, preencha email e senha.";
    console.log('Campos de login não preenchidos');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginMessage.textContent = "Login bem-sucedido!";
    mostrarAlerta("Login bem-sucedido!", "success");
    console.log('Login realizado com sucesso');
  } catch (error) {
    loginMessage.textContent = 'Erro ao fazer login: ' + error.message;
    mostrarAlerta('Erro ao fazer login: ' + error.message, "error");
    console.log('Erro ao fazer login:', error);
  }

async function logout() {
  try {
    await signOut(auth);
    mostrarAlerta("Deslogado com sucesso!", "success");
  } catch (error) {
    mostrarAlerta('Erro ao deslogar: ' + error.message, "error");
  }
}

// Funções de Livros (Firestore)
async function abrirModal(livroId) {
  if (!currentUser) return;

  try {
  const livroRef = doc(db, 'users/' + currentUser.uid + '/livros', livroId);
    const livroDoc = await getDoc(livroRef);

    if (!livroDoc.exists()) {
      mostrarAlerta("Livro não encontrado!", "error");
      return;
    }
    // ...existing code...
  } catch (error) {
    mostrarAlerta('Erro ao abrir modal: ' + error.message, "error");
  }
}
}
}

// Função de registro personalizada
async function customRegister() {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const birthdate = document.getElementById('registerBirthdate').value;
  const gender = document.getElementById('registerGender').value;
  const registerMessage = document.getElementById('registerMessage');

  if (!username || !email || !password || !birthdate || !gender) {
    registerMessage.textContent = "Preencha todos os campos.";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Salvar dados extras no Firestore
    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      username: username,
      email: email,
      birthdate: birthdate,
      gender: gender
    });
    registerMessage.style.color = 'green';
    registerMessage.textContent = "Registro realizado com sucesso! Você já pode acessar sua biblioteca.";
    mostrarAlerta("Registro realizado com sucesso!", "success");
    showLoginForm();
  } catch (error) {
    registerMessage.style.color = 'red';
    registerMessage.textContent = 'Erro ao registrar: ' + error.message;
    mostrarAlerta('Erro ao registrar: ' + error.message, "error");
  }
}

// Alterna entre login e registro
function showRegisterForm() {
  document.getElementById('loginFormContainer').style.display = 'none';
  document.getElementById('registerFormContainer').style.display = 'block';
  document.getElementById('loginMessage').textContent = '';
}

function showLoginForm() {
  document.getElementById('registerFormContainer').style.display = 'none';
  document.getElementById('loginFormContainer').style.display = 'block';
  document.getElementById('registerMessage').textContent = '';
}

// Expor funções para o escopo global
window.handleLogin = handleLogin;
window.customRegister = customRegister;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  modalIndex = null;
}

async function editarLivroModal() {
  if (!currentUser || modalIndex === null) return; // modalIndex agora é o ID do livro

  try {
  const livroRef = doc(db, 'users/' + currentUser.uid + '/livros', modalIndex);
    const livroDoc = await getDoc(livroRef);

    if (!livroDoc.exists()) {
      mostrarAlerta("Livro não encontrado para edição!", "error");
      return;
    }
    const livro = livroDoc.data();
    editandoIndex = modalIndex; // editandoIndex agora guarda o ID do documento
  formulario.dataset.livroId = modalIndex; // Armazena o ID no formulário para salvarLivro

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
  } catch (error) {
  mostrarAlerta('Erro ao preparar edição: ' + error.message, "error");
  }
}

function lerMaisSinopse() {
  if (!currentUser || modalIndex === null) return;
  // A sinopse já está no modal, apenas remove a classe de truncamento
  const sinopseEl = document.getElementById('modalSinopse');
  sinopseEl.classList.remove('book-sinopse');
  document.getElementById('btnLerMais').style.display = 'none';
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const icon = document.querySelector('#btnToggleTheme i');
  if (document.body.classList.contains('dark')) {
    icon.className = 'fas fa-sun';
    localStorage.setItem('theme', 'dark');
  } else {
    icon.className = 'fas fa-moon';
    localStorage.setItem('theme', 'light');
  }
}

function carregarTema() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    const themeBtn = document.getElementById('btnToggleTheme');
    if (themeBtn) {
      const icon = themeBtn.querySelector('i');
      icon.className = 'fas fa-sun';
    }
  }
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
  delete formulario.dataset.livroId; // Limpa o ID do livro do dataset
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

async function salvarMeta() {
  if (!currentUser) {
    mostrarAlerta("Você precisa estar logado para salvar a meta!", "error");
    return;
  }
  const ano = document.getElementById("metaAno").value;
  const total = document.getElementById("metaTotalInput").value;
  if (!ano || !total) {
    mostrarAlerta("Preencha o ano e a quantidade de livros!", "error");
    return;
  }

  try {
  const metaRef = doc(db, 'users/' + currentUser.uid + '/meta', 'anual');
    await setDoc(metaRef, {
      ano: Number(ano),
      total: Number(total)
    }, { merge: true }); // Use setDoc com merge para criar ou atualizar
    metaSection.classList.add("hidden");
    carregarLivros(); // Recarrega para atualizar a meta visual
    mostrarAlerta("Meta salva com sucesso!", "success");
  } catch (error) {
  mostrarAlerta('Erro ao salvar meta: ' + error.message, "error");
  }
}

async function carregarMeta() {
  if (!currentUser) return;
  const currentYear = new Date().getFullYear();
  try {
  const metaRef = doc(db, 'users/' + currentUser.uid + '/meta', 'anual');
    const metaDoc = await getDoc(metaRef);

    if (metaDoc.exists()) {
      const metaData = metaDoc.data();
      document.getElementById("metaAno").value = metaData.ano || currentYear;
      document.getElementById("metaTotalInput").value = metaData.total || 12;
    } else {
      document.getElementById("metaAno").value = currentYear;
      document.getElementById("metaTotalInput").value = 12;
    }
  } catch (error) {
    console.error("Erro ao carregar meta:", error);
    document.getElementById("metaAno").value = currentYear;
    document.getElementById("metaTotalInput").value = 12;
  }
}

async function salvarLivro() {
  if (!currentUser) {
    mostrarAlerta("Você precisa estar logado para salvar livros!", "error");
    return;
  }

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

  const livroData = {
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
    createdAt: new Date() // Adiciona um timestamp para ordenação
  };

  try {
  const livrosColRef = collection(db, 'users/' + currentUser.uid + '/livros');

    if (editandoIndex !== null) {
      const livroId = formulario.dataset.livroId;
      const livroRef = doc(livrosColRef, livroId);
      await updateDoc(livroRef, livroData);
      mostrarAlerta("Livro atualizado com sucesso!", "success");
    } else {
      await addDoc(livrosColRef, livroData);
      mostrarAlerta("Livro adicionado com sucesso!", "success");
    }
    fecharFormulario();
    carregarLivros();
  } catch (error) {
  mostrarAlerta('Erro ao salvar livro: ' + error.message, "error");
  }
}

async function carregarLivros() {
  if (!currentUser) return;

  lista.innerHTML = "";
  const currentYear = new Date().getFullYear();
  let metaTotal = 12; // Valor padrão

  try {
    // Carregar meta do usuário
    const metaRef = doc(db, `users/${currentUser.uid}/meta`, 'anual');
    const metaDoc = await getDoc(metaRef);
    if (metaDoc.exists()) {
      const metaData = metaDoc.data();
      metaTotal = Number(metaData.total || 12);
      document.getElementById("metaAno").value = metaData.ano || currentYear;
      document.getElementById("metaTotalInput").value = metaData.total || 12;
    } else {
      document.getElementById("metaAno").value = currentYear;
      document.getElementById("metaTotalInput").value = 12;
    }

    const livrosColRef = collection(db, `users/${currentUser.uid}/livros`);
    const livrosSnapshot = await getDocs(livrosColRef);
    const livros = [];
    livrosSnapshot.forEach(doc => {
      livros.push({ id: doc.id, ...doc.data() }); // Adiciona o ID do documento
    });

    // Ordena os livros pelo timestamp de criação (mais recente primeiro)
    livros.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

    let contLidoAno = 0;
    let countTodos = livros.length;
    let countQueroLer = 0;
    let countLendo = 0;
    let countLido = 0;

    livros.forEach(l => {
      if (l.status === "Lido" && l.inMeta && l.metaAnoLivro == currentYear) {
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
    document.getElementById("metaAnoDisplay").textContent = currentYear;
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

    // Filtrar e exibir livros
    livros.filter(l => filtroAtual === "Todos" || l.status === filtroAtual).forEach(l => {
      const progresso = l.paginas > 0 ? Math.min(100, Math.round((l.paginasLidas / l.paginas) * 100)) : 0;
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
        </div>
      `;
      const progressFill = div.querySelector('.book-progress-fill');
      if (progressFill) progressFill.style.width = progresso + '%';
      div.onclick = () => abrirModal(l.id); // Passa o ID do documento
      lista.appendChild(div);
    });

  } catch (error) {
    mostrarAlerta(`Erro ao carregar livros: ${error.message}`, "error");
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
      !filterMenu.contains(event.target) && (!btnFilterMenu || !btnFilterMenu.contains(event.target))) {
    filterMenu.classList.add('hidden');
  }
});

// Adicione esta função para deletar um livro (opcional, mas útil)
async function deletarLivroModal() {
  if (!currentUser || modalIndex === null) return;

  if (confirm("Tem certeza que deseja deletar este livro?")) {
    try {
      const livroRef = doc(db, `users/${currentUser.uid}/livros`, modalIndex);
      await deleteDoc(livroRef);
      mostrarAlerta("Livro deletado com sucesso!", "success");
      fecharModal();
      carregarLivros();
    } catch (error) {
      mostrarAlerta(`Erro ao deletar livro: ${error.message}`, "error");
    }
  }
}

