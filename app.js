// app.js - Lógica JS para Minha Biblioteca Premium (corrigido)

// Importar funções do Firebase SDK v9
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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
const analytics = getAnalytics(app);

// Variáveis globais
let editandoIndex = null;
let filtroAtual = "Todos";
let modalIndex = null;
let currentUser = null;

// Elementos DOM
const lista = document.getElementById("listaLivros");
const formulario = document.getElementById("formulario");
const metaSection = document.getElementById("metaSection");
const modal = document.getElementById("modal");
const filterMenu = document.getElementById("filterMenu");
const loginSection = document.getElementById("loginSection");
const mainApp = document.getElementById("mainApp");

document.addEventListener('DOMContentLoaded', function() {
  carregarTema();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      loginSection.classList.add('hidden');
      mainApp.classList.remove('hidden');
      carregarLivros();
      carregarMeta();
    } else {
      currentUser = null;
      loginSection.classList.remove('hidden');
      mainApp.classList.add('hidden');
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

// Funções de Autenticação
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
    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      username,
      email,
      birthdate,
      gender
    });
    registerMessage.style.color = 'green';
    registerMessage.textContent = "Registro realizado com sucesso! Você já pode acessar sua biblioteca.";
    mostrarAlerta("Registro concluído com sucesso!", "success");
    showLoginForm();
  } catch (error) {
    registerMessage.style.color = 'red';
    registerMessage.textContent = 'Erro ao registrar: ' + error.message;
    mostrarAlerta('Erro ao registrar: ' + error.message, "error");
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const loginMessage = document.getElementById('loginMessage');

  if (!email || !password) {
    loginMessage.textContent = "Por favor, preencha email e senha.";
    console.log('Campos de login não preenchidos');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginMessage.style.color = 'green';
    loginMessage.textContent = "Login bem-sucedido!";
    mostrarAlerta("Login bem-sucedido!", "success");
    console.log('Login realizado com sucesso');
  } catch (error) {
    loginMessage.style.color = 'red';
    loginMessage.textContent = 'Erro ao fazer login: ' + error.message;
    mostrarAlerta('Erro ao fazer login: ' + error.message, "error");
    console.log('Erro ao fazer login:', error);
  }
}

async function logout() {
  try {
    await signOut(auth);
    mostrarAlerta("Deslogado com sucesso!", "success");
  } catch (error) {
    mostrarAlerta('Erro ao deslogar: ' + error.message, "error");
  }
}

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

// Expor funções globais
window.handleLogin = handleLogin;
window.customRegister = customRegister;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.logout = logout;

// ... resto do código de livros, meta e UI (inalterado) ...
