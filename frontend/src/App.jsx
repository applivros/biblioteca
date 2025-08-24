import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import GlobalStyle from './styles/GlobalStyle';
import Estante from './components/Estante';
import Busca from './components/Busca';
import CadastroManual from './components/CadastroManual';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import Menu from './components/Menu';
import Auth from './components/Auth';

const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#4A90E2', // azul claro
    secondary: '#A8E6CF', // verde menta suave
    background: '#F5F5F5', // cinza claro
    text: '#424242', // cinza escuro
    accent: '#FFD54F', // amarelo marcador
  },
  fonts: {
    main: 'Roboto, Arial, sans-serif',
    heading: 'Montserrat, Arial, sans-serif',
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#4A90E2',
    secondary: '#A8E6CF',
    background: '#424242',
    text: '#F5F5F5',
    accent: '#FFD54F',
  },
  fonts: {
    main: 'Roboto, Arial, sans-serif',
    heading: 'Montserrat, Arial, sans-serif',
  },
};

// Removido array pages fixo

function App() {
  const [themeMode, setThemeMode] = useState('light');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState('estante');
  const [livros, setLivros] = useState([]);

  const carregarLivros = async () => {
    const querySnapshot = await getDocs(collection(db, 'books'));
    const livrosArr = [];
    querySnapshot.forEach((docSnap) => {
      livrosArr.push({ id: docSnap.id, ...docSnap.data() });
    });
    setLivros(livrosArr);
  };

  useEffect(() => {
    if (user) carregarLivros();
  }, [user]);

  const handleLogout = async () => {
    try {
      const { getAuth, signOut } = await import('firebase/auth');
      const auth = getAuth(app);
      await signOut(auth);
    } catch (err) {
      // Se der erro, ignora
    }
    setUser(null);
    setPage('estante');
  };

  if (!user) {
    return (
      <ThemeProvider theme={themeMode === 'dark' ? darkTheme : lightTheme}>
        <GlobalStyle />
        <Auth onAuth={setUser} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={themeMode === 'dark' ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Menu
        navItems={[
          { key: 'estante', label: 'Minha Estante', icon: '📚', active: page === 'estante', onClick: () => setPage('estante') },
          { key: 'busca', label: 'Buscar Livros', icon: '🔍', active: page === 'busca', onClick: () => setPage('busca') },
          { key: 'cadastro', label: 'Cadastrar Livro', icon: '➕', active: page === 'cadastro', onClick: () => setPage('cadastro') },
          { key: 'logout', label: 'Sair', icon: '🚪', active: false, onClick: handleLogout }
        ]}
        extra={
          <button
            style={{
              background: 'none',
              border: 'none',
              color: themeMode === 'dark' ? '#FBD46D' : '#4F8A8B',
              fontSize: '1.3rem',
              cursor: 'pointer',
              marginLeft: '1rem',
              fontWeight: 'bold',
              transition: 'color 0.2s',
            }}
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            aria-label="Alternar modo claro/escuro"
          >{themeMode === 'dark' ? '🌙' : '☀️'}</button>
        }
      />
      <div className="container">
        {page === 'estante' && <Estante livros={livros || []} carregarLivros={carregarLivros} />}
        {page === 'busca' && <Busca carregarLivros={carregarLivros} />}
        {page === 'cadastro' && <CadastroManual carregarLivros={carregarLivros} />}
      </div>
    </ThemeProvider>
  );
}

export default App;
