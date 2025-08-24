import React, { useState } from 'react';
import styled from 'styled-components';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { app } from '../firebase';


const AuthWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${({ theme }) => theme.mode === 'dark' ? '#181A20' : '#F7F8FA'};
`;
const Card = styled.div`
  background: ${({ theme }) => theme.mode === 'dark' ? '#23272F' : '#fff'};
  border-radius: 14px;
  box-shadow: 0 2px 16px rgba(24,26,32,0.07);
  padding: 2.2rem 2.5rem;
  min-width: 320px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  animation: fadeIn 0.7s;
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 700px) {
    padding: 1rem;
    min-width: 90vw;
  }
`;
const Title = styled.h2`
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 700;
  margin-bottom: 0.5rem;
`;
const Input = styled.input`
  padding: 0.65rem 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 1rem;
  margin-bottom: 0.7rem;
  background: ${({ theme }) => theme.mode === 'dark' ? '#23272F' : '#F7F8FA'};
  color: ${({ theme }) => theme.colors.text};
  transition: border 0.2s;
  &:focus {
    border: 1.5px solid ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;
const Button = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(24,26,32,0.07);
  transition: background 0.2s, transform 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.04);
  }
`;
const Switch = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-weight: 500;
  margin-top: 0.5rem;
  text-align: center;
  &:hover { text-decoration: underline; }
`;
const ErrorMsg = styled.div`
  color: #d9534f;
  font-size: 0.95rem;
  text-align: center;
  margin-top: 0.5rem;
`;

function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const auth = getAuth(app);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        // Login com Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        const user = userCredential.user;
        onAuth({ id: user.uid, name: user.displayName || '', email: user.email });
      } else {
        if (!form.name) return setError('Preencha o nome.');
        // Cadastro com Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: form.name });
        onAuth({ id: user.uid, name: form.name, email: user.email });
      }
    } catch (err) {
      setError(err.message || 'Erro ao autenticar.');
    }
  };

  return (
    <AuthWrapper>
      <Card>
        <Title>{isLogin ? 'Entrar' : 'Cadastrar'}</Title>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Nome" required />
          )}
          <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="E-mail" required />
          <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Senha" required />
          <Button type="submit">{isLogin ? 'Entrar' : 'Cadastrar'}</Button>
        </form>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Switch onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </Switch>
      </Card>
    </AuthWrapper>
  );
}

export default Auth;
