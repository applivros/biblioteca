console.log(">>> App.js iniciou <<<");
// app.js - Lógica JS para Minha Biblioteca Premium (versão corrigida e estável)

// Firebase SDK v9 (Modular)
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// ===== Config Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyAGcrW9JyAGM3nf4eHdtXaVozJOrKx8e-s",
  authDomain: "applivro-75c5b.firebaseapp.com",
  projectId: "applivro-75c5b",
  storageBucket: "applivro-75c5b.firebasestorage.app",
  messagingSenderId: "196142073774",
  appId: "1:196142073774:web:b1d953b7c633049c9a2a3f",
  measurementId: "G-T7P5KPE9P4",
};

// Inicializações centrais
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics pode quebrar em alguns ambientes (http/local). Protegido:
let analytics = null;
isSupported()
  .then((ok) => {
    if (ok) analytics = getAnalytics(app);
  })
  .catch(() => {
    // ignora se não houver suporte
  });

// ===== Estado/UI =====
let editandoIndex = null; // guarda ID do doc em edição
let filtroAtual = "Todos";
let modalIndex = null; // ID do doc aberto no modal
let currentUser = null; // usuário logado

// Elementos DOM
const lista = document.getElementById("listaLivros");
const formulario = document.getElementById("formulario");
const metaSection = document.getElementById("metaSection");
const modal = document.getElementById("modal");
const filterMenu = document.getElementById("filterMenu");
const loginSection = document.getElementById("loginSection");
const mainApp = document.getElementById("mainApp");

// ===== Boot =====
document.addEventListener("DOMContentLoaded", () => {
  carregarTema();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      loginSection.classList.add("hidden");
      mainApp.classList.remove("hidden");
      carregarLivros();
      carregarMeta();
    } else {
      currentUser = null;
      loginSection.classList.remove("hidden");
      mainApp.classList.add("hidden");
      // Limpa visuais
      if (lista) {
        lista.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
            <i class="fas fa-user-circle" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <h3>Faça login para ver sua biblioteca</h3>
            <p>Use o formulário acima para entrar ou criar uma conta.</p>
          </div>
        `;
      }
      setBadge("badgeTodos", 0);
      setBadge("badgeQueroLer", 0);
      setBadge("badgeLendo", 0);
      setBadge("badgeLido", 0);
      setText("metaContador", 0);
      setText("metaTotalDisplay", 0);
      setStyleWidth("metaBar", "0%");
    }
  });

  // Fechar menu de filtro ao clicar fora
  document.addEventListener("click", (event) => {
    const btnFilterMenu = document.getElementById("btnFilterMenu");
    if (
      filterMenu &&
      !filterMenu.classList.contains("hidden") &&
      !filterMenu.contains(event.target) &&
      (!btnFilterMenu || !btnFilterMenu.contains(event.target))
    ) {
      filterMenu.classList.add("hidden");
    }
  });
});

// ===== Helpers visuais =====
function mostrarAlerta(mensagem, tipo) {
  const alerta = document.createElement("div");
  alerta.textContent = mensagem;
  Object.assign(alerta.style, {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "16px 32px",
    borderRadius: "12px",
    zIndex: 2000,
    color: "white",
    fontWeight: "bold",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    background: tipo === "error" ? "#ef4444" : "#10b981",
  });
  document.body.appendChild(alerta);
  setTimeout(() => alerta.remove(), 2500);
}
function setBadge(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}
function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}
function setStyleWidth(id, w) {
  const el = document.getElementById(id);
  if (el) el.style.width = w;
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== Tabs/Filtro =====
function atualizarAbas(status) {
  const tabs = document.querySelectorAll(".tabs-container .tab-btn");
  tabs.forEach((t) => t.classList.remove("active"));
  if (status === "Todos") document.getElementById("tabTodos")?.classList.add("active");
  if (status === "Quero ler") document.getElementById("tabQueroLer")?.classList.add("active");
  if (status === "Lendo") document.getElementById("tabLendo")?.classList.add("active");
  if (status === "Lido") document.getElementById("tabLido")?.classList.add("active");
}
function filtrar(status) {
  filtroAtual = status;
  carregarLivros();
  if (!filterMenu.classList.contains("hidden")) toggleFilterMenu();
}
function toggleFilterMenu() {
  filterMenu.classList.toggle("hidden");
}

// ===== Tema =====
function toggleTheme() {
  document.body.classList.toggle("dark");
  const icon = document.querySelector("#btnToggleTheme i");
  if (document.body.classList.contains("dark")) {
    if (icon) icon.className = "fas fa-sun";
    localStorage.setItem("theme", "dark");
  } else {
    if (icon) icon.className = "fas fa-moon";
    localStorage.setItem("theme", "light");
  }
}
function carregarTema() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    const themeBtn = document.getElementById("btnToggleTheme");
    const icon = themeBtn?.querySelector("i");
    if (icon) icon.className = "fas fa-sun";
  }
}

// ===== Auth =====
async function customRegister() {
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const birthdate = document.getElementById("registerBirthdate").value;
  const gender = document.getElementById("registerGender").value;
  const registerMessage = document.getElementById("registerMessage");

  if (!username || !email || !password || !birthdate || !gender) {
    registerMessage.textContent = "Preencha todos os campos.";
    return;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    await addDoc(collection(db, "users"), {
      uid: user.uid,
      username,
      email,
      birthdate,
      gender,
    });
    registerMessage.style.color = "green";
    registerMessage.textContent = "Registro realizado com sucesso! Você já pode acessar sua biblioteca.";
    mostrarAlerta("Registro concluído com sucesso!", "success");
    showLoginForm();
  } catch (error) {
    registerMessage.style.color = "red";
    registerMessage.textContent = "Erro ao registrar: " + error.message;
    mostrarAlerta("Erro ao registrar: " + error.message, "error");
  }
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const loginMessage = document.getElementById("loginMessage");

  if (!email || !password) {
    loginMessage.style.color = "red";
    loginMessage.textContent = "Por favor, preencha email e senha.";
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginMessage.style.color = "green";
    loginMessage.textContent = "Login bem-sucedido!";
    mostrarAlerta("Login bem-sucedido!", "success");
  } catch (error) {
    loginMessage.style.color = "red";
    loginMessage.textContent = "Erro ao fazer login: " + error.message;
    mostrarAlerta("Erro ao fazer login: " + error.message, "error");
  }
}

async function logout() {
  try {
    await signOut(auth);
    mostrarAlerta("Deslogado com sucesso!", "success");
  } catch (error) {
    mostrarAlerta("Erro ao deslogar: " + error.message, "error");
  }
}

function showRegisterForm() {
  document.getElementById("loginFormContainer").style.display = "none";
  document.getElementById("registerFormContainer").style.display = "block";
  document.getElementById("loginMessage").textContent = "";
}
function showLoginForm() {
  document.getElementById("registerFormContainer").style.display = "none";
  document.getElementById("loginFormContainer").style.display = "block";
  document.getElementById("registerMessage").textContent = "";
}

// ===== Meta =====
function abrirMeta() {
  formulario.classList.add("hidden");
  metaSection.classList.remove("hidden");
  carregarMeta();
  scrollToTop();
}
async function salvarMeta() {
  if (!currentUser) return mostrarAlerta("Você precisa estar logado para salvar a meta!", "error");
  const ano = document.getElementById("metaAno").value;
  const total = document.getElementById("metaTotalInput").value;
  if (!ano || !total) return mostrarAlerta("Preencha o ano e a quantidade de livros!", "error");
  try {
    const metaRef = doc(db, `users/${currentUser.uid}/meta`, "anual");
    await setDoc(metaRef, { ano: Number(ano), total: Number(total) }, { merge: true });
    metaSection.classList.add("hidden");
    carregarLivros();
    mostrarAlerta("Meta salva com sucesso!", "success");
  } catch (error) {
    mostrarAlerta("Erro ao salvar meta: " + error.message, "error");
  }
}
async function carregarMeta() {
  if (!currentUser) return;
  const currentYear = new Date().getFullYear();
  try {
    const metaRef = doc(db, `users/${currentUser.uid}/meta`, "anual");
    const snap = await getDoc(metaRef);
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById("metaAno").value = d.ano || currentYear;
      document.getElementById("metaTotalInput").value = d.total || 12;
    } else {
      document.getElementById("metaAno").value = currentYear;
      document.getElementById("metaTotalInput").value = 12;
    }
  } catch (err) {
    document.getElementById("metaAno").value = currentYear;
    document.getElementById("metaTotalInput").value = 12;
  }
}

// ===== Livros =====
function abrirFormulario() {
  formulario.classList.remove("hidden");
  metaSection.classList.add("hidden");
  document.getElementById("formTitulo").textContent = editandoIndex ? "Editar Livro" : "Adicionar Livro";
  scrollToTop();
}
function fecharFormulario() {
  formulario.classList.add("hidden");
  limparFormulario();
  editandoIndex = null;
  delete formulario.dataset.livroId;
}
function limparFormulario() {
  ["titulo","autor","ano","paginas","paginasLidas","capa","sinopse","metaAnoLivro"].forEach((id)=>{
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("status").value = "Quero ler";
  document.getElementById("inMeta").checked = false;
}

async function salvarLivro() {
  if (!currentUser) return mostrarAlerta("Você precisa estar logado para salvar livros!", "error");

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

  if (!titulo || !autor) return mostrarAlerta("Preencha o título e o autor do livro!", "error");
  if (ano < 0 || paginas < 0 || paginasLidas < 0) return mostrarAlerta("Ano, páginas e páginas lidas não podem ser negativos!", "error");
  if (paginas && paginasLidas > paginas) return mostrarAlerta("Páginas lidas não pode ser maior que o total de páginas!", "error");

  const livroData = {
    titulo,
    autor,
    ano,
    paginas,
    paginasLidas,
    capa: capa || "https://placehold.co/200x300/4f46e5/white?text=%F0%9F%93%9A",
    status,
    inMeta,
    metaAnoLivro,
    sinopse,
    createdAt: new Date(),
  };

  try {
    const livrosCol = collection(db, `users/${currentUser.uid}/livros`);
    if (editandoIndex) {
      const livroRef = doc(livrosCol, formulario.dataset.livroId);
      await updateDoc(livroRef, livroData);
      mostrarAlerta("Livro atualizado com sucesso!", "success");
    } else {
      await addDoc(livrosCol, livroData);
      mostrarAlerta("Livro adicionado com sucesso!", "success");
    }
    fecharFormulario();
    carregarLivros();
  } catch (error) {
    mostrarAlerta("Erro ao salvar livro: " + error.message, "error");
  }
}

async function carregarLivros() {
  if (!currentUser) return;
  if (lista) lista.innerHTML = "";

  const currentYear = new Date().getFullYear();
  let metaTotal = 12;
  try {
    // Meta
    const metaRef = doc(db, `users/${currentUser.uid}/meta`, "anual");
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) {
      const m = metaSnap.data();
      metaTotal = Number(m.total || 12);
      setValue("metaAno", m.ano || currentYear);
      setValue("metaTotalInput", m.total || 12);
    } else {
      setValue("metaAno", currentYear);
      setValue("metaTotalInput", 12);
    }

    // Livros
    const livrosCol = collection(db, `users/${currentUser.uid}/livros`);
    const snap = await getDocs(livrosCol);
    const livros = [];
    snap.forEach((d) => livros.push({ id: d.id, ...d.data() }));

    // Ordena por createdAt desc (se existir)
    livros.sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });

    let contLidoAno = 0;
    let countTodos = livros.length;
    let countQueroLer = 0;
    let countLendo = 0;
    let countLido = 0;

    livros.forEach((l) => {
      if (l.status === "Lido" && l.inMeta && Number(l.metaAnoLivro) == currentYear) contLidoAno++;
      if (l.status === "Quero ler") countQueroLer++;
      if (l.status === "Lendo") countLendo++;
      if (l.status === "Lido") countLido++;
    });

    setBadge("badgeTodos", countTodos);
    setBadge("badgeQueroLer", countQueroLer);
    setBadge("badgeLendo", countLendo);
    setBadge("badgeLido", countLido);
    setText("metaAnoDisplay", currentYear);
    setText("metaContador", contLidoAno);
    setText("metaTotalDisplay", metaTotal);

    const perc = metaTotal > 0 ? Math.min(100, Math.round((contLidoAno / metaTotal) * 100)) : 0;
    setTimeout(() => setStyleWidth("metaBar", perc + "%"), 50);

    atualizarAbas(filtroAtual);

    if (livros.length === 0) {
      if (lista) {
        lista.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
            <i class="fas fa-book-open" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <h3>Sua biblioteca está vazia</h3>
            <p>Adicione seu primeiro livro clicando no botão +</p>
          </div>
        `;
      }
      return;
    }

    // Render
    livros
      .filter((l) => filtroAtual === "Todos" || l.status === filtroAtual)
      .forEach((l) => {
        const progresso = l.paginas > 0 ? Math.min(100, Math.round((Number(l.paginasLidas || 0) / Number(l.paginas)) * 100)) : 0;
        const div = document.createElement("div");
        div.className = "book-card fade-in";
        div.innerHTML = `
          <img src="${l.capa}" alt="Capa do livro: ${escapeHtml(l.titulo)}" class="book-cover" onerror="this.src='https://placehold.co/200x300/4f46e5/white?text=%F0%9F%93%9A'">
          <div class="book-progress"><div class="book-progress-fill"></div></div>
          <div class="book-info">
            <div class="book-title">${escapeHtml(l.titulo)}</div>
            <div class="book-author">${escapeHtml(l.autor)}</div>
            <span class="book-status status-${(l.status || "").toLowerCase().replace(" ", "-")}">${l.status}</span>
          </div>
        `;
        const progressFill = div.querySelector(".book-progress-fill");
        if (progressFill) progressFill.style.width = progresso + "%";
        div.onclick = () => abrirModal(l.id);
        lista.appendChild(div);
      });
  } catch (error) {
    mostrarAlerta(`Erro ao carregar livros: ${error.message}`, "error");
  }
}
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===== Modal =====
async function abrirModal(livroId) {
  if (!currentUser) return;
  try {
    const livroRef = doc(db, `users/${currentUser.uid}/livros`, livroId);
    const livroDoc = await getDoc(livroRef);
    if (!livroDoc.exists()) return mostrarAlerta("Livro não encontrado!", "error");
    const l = livroDoc.data();
    modalIndex = livroId;

    document.getElementById("modalTitulo").textContent = l.titulo || "";
    document.getElementById("modalAutor").textContent = l.autor || "";
    document.getElementById("modalAno").textContent = l.ano || "";
    document.getElementById("modalPaginas").textContent = l.paginas || 0;
    document.getElementById("modalPaginasLidas").textContent = l.paginasLidas || 0;
    document.getElementById("modalStatus").textContent = l.status || "";
    document.getElementById("modalMeta").textContent = l.metaAnoLivro || "";

    const sinopseEl = document.getElementById("modalSinopse");
    sinopseEl.classList.add("book-sinopse");
    sinopseEl.textContent = l.sinopse || "Sem sinopse.";
    const btnLerMais = document.getElementById("btnLerMais");
    btnLerMais.style.display = l.sinopse && l.sinopse.length > 0 ? "inline-flex" : "none";

    modal.classList.add("show");
  } catch (error) {
    mostrarAlerta("Erro ao abrir modal: " + error.message, "error");
  }
}
function fecharModal() {
  modal.classList.remove("show");
  modalIndex = null;
}
function lerMaisSinopse() {
  if (!currentUser || modalIndex === null) return;
  const sinopseEl = document.getElementById("modalSinopse");
  sinopseEl.classList.remove("book-sinopse");
  document.getElementById("btnLerMais").style.display = "none";
}

async function editarLivroModal() {
  if (!currentUser || modalIndex === null) return;
  try {
    const livroRef = doc(db, `users/${currentUser.uid}/livros`, modalIndex);
    const livroDoc = await getDoc(livroRef);
    if (!livroDoc.exists()) return mostrarAlerta("Livro não encontrado para edição!", "error");

    const l = livroDoc.data();
    editandoIndex = modalIndex;
    formulario.dataset.livroId = modalIndex;

    setValue("titulo", l.titulo || "");
    setValue("autor", l.autor || "");
    setValue("ano", l.ano || "");
    setValue("paginas", l.paginas || "");
    setValue("paginasLidas", l.paginasLidas || "");
    setValue("capa", l.capa || "");
    setValue("sinopse", l.sinopse || "");
    setValue("status", l.status || "Quero ler");
    document.getElementById("inMeta").checked = !!l.inMeta;
    setValue("metaAnoLivro", l.metaAnoLivro || "");

    fecharModal();
    abrirFormulario();
  } catch (error) {
    mostrarAlerta("Erro ao preparar edição: " + error.message, "error");
  }
}

async function deletarLivroModal() {
  if (!currentUser || modalIndex === null) return;
  if (!confirm("Tem certeza que deseja deletar este livro?")) return;
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

// ===== Exposição Global (necessário por usar type="module" no script) =====
window.handleLogin = handleLogin;
window.customRegister = customRegister;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.logout = logout;
window.abrirMeta = abrirMeta;
window.salvarMeta = salvarMeta;
window.abrirFormulario = abrirFormulario;
window.fecharFormulario = fecharFormulario;
window.salvarLivro = salvarLivro;
window.filtrar = filtrar;
window.toggleFilterMenu = toggleFilterMenu;
window.toggleTheme = toggleTheme;
window.fecharModal = fecharModal;
window.editarLivroModal = editarLivroModal;
window.deletarLivroModal = deletarLivroModal;
window.lerMaisSinopse = lerMaisSinopse;


console.log(">>> App.js terminou <<<", { handleLogin });

