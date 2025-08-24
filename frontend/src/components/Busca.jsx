import React, { useState } from 'react';
import axios from 'axios';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import styled from 'styled-components';


const BuscaWrapper = styled.div`
  background: ${({ theme }) => theme.colors.secondary};
  padding: 2rem 1rem 1rem 1rem;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(251, 212, 109, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeIn 0.7s ease;
`;
const LivroCard = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  margin: 0.5rem 0;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(79, 138, 139, 0.07);
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 4px 24px rgba(79, 138, 139, 0.13);
  }
`;
const Cover = styled.img`
  width: 60px;
  height: 90px;
  object-fit: cover;
  margin-right: 1rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
`;
const AddButton = styled.button`
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary} 60%, ${({ theme }) => theme.colors.secondary} 100%);
  color: #fff;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  margin-left: auto;
  font-weight: 500;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(79, 138, 139, 0.09);
  transition: background 0.2s, transform 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.accent};
    transform: scale(1.05);
  }
`;

function Busca({ carregarLivros }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscarLivros = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await axios.get('http://localhost:4000/api/search?q=' + query);
    setResultados(res.data);
    setLoading(false);
  };

  const adicionarLivro = async (livro) => {
    const info = livro.volumeInfo;
    try {
      await addDoc(collection(db, 'books'), {
        google_id: livro.id,
        title: info.title,
        authors: info.authors ? info.authors.join(', ') : '',
        description: info.description || '',
        cover: info.imageLinks?.thumbnail || '',
        added_by: 'google',
        status: 'Quero ler',
        rating: 0,
        comments: ''
      });
      alert('Livro adicionado à estante!');
      if (carregarLivros) {
        setTimeout(() => {
          carregarLivros();
        }, 500);
      }
    } catch (err) {
      alert('Erro ao adicionar livro: ' + err.message);
      console.error(err);
    }
  };

  return (
    <BuscaWrapper>
      <form onSubmit={buscarLivros} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar livro na Google Books..."
          style={{ flex: 1, minWidth: '200px', padding: '0.7rem 1rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        />
        <AddButton as="button" type="submit">Buscar</AddButton>
      </form>
      {loading && <p>Buscando...</p>}
      {resultados.map(livro => {
        const info = livro.volumeInfo;
        return (
          <LivroCard key={livro.id}>
            <Cover src={info.imageLinks?.thumbnail || ''} alt={info.title} />
            <div>
              <strong>{info.title}</strong><br />
              <span>{info.authors?.join(', ')}</span>
            </div>
            <AddButton onClick={() => adicionarLivro(livro)}>Adicionar</AddButton>
          </LivroCard>
        );
      })}
    </BuscaWrapper>
  );
}

export default Busca;
