import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import styled from 'styled-components';

const EstanteWrapper = styled.div`
  background: #fff;
  border-radius: 14px;
  padding: 2rem 1rem 1rem 1rem;
  box-shadow: 0 4px 16px rgba(79, 138, 139, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeIn 0.7s ease;
`;
const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  @media (max-width: 900px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }
`;
const LivroCard = styled.div`
  background: #f6f6f6;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(79, 138, 139, 0.07);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  animation: fadeInCard 0.6s;
  &:hover {
    box-shadow: 0 4px 24px rgba(79, 138, 139, 0.13);
    transform: scale(1.03);
  }
  @keyframes fadeInCard {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @media (max-width: 700px) {
    padding: 0.7rem;
    border-radius: 10px;
  }
`;
const Cover = styled.img`
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-bottom: 0.7rem;
`;
const Title = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 0.3rem;
`;
const StatusTag = styled.span`
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
  border-radius: 6px;
  padding: 0.2rem 0.7rem;
  margin-bottom: 0.5rem;
`;
const RemoveButton = styled.button`
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.accent} 60%, ${({ theme }) => theme.colors.secondary} 100%);
  color: #fff;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  margin-top: 0.7rem;
  box-shadow: 0 2px 8px rgba(79, 138, 139, 0.09);
  transition: background 0.2s, transform 0.2s;
  &:hover {
    background: #d9534f;
    transform: scale(1.05);
  }
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(79, 138, 139, 0.18);
  padding: 2rem;
  min-width: 320px;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: fadeInModal 0.5s;
  margin: 0 auto;
  @keyframes fadeInModal {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
  }
  @media (max-width: 900px) {
    padding: 1rem;
    min-width: 80vw;
    max-width: 95vw;
    border-radius: 12px;
  }
  @media (max-width: 700px) {
    padding: 0.7rem;
    min-width: 98vw;
    max-width: 99vw;
    border-radius: 8px;
  }
`;
const CloseBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  cursor: pointer;
`;
const StatusSelect = styled.select`
  margin: 0.5rem 0;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 1rem;
`;
const RatingStars = styled.div`
  display: flex;
  gap: 0.2rem;
  margin: 0.5rem 0;
`;
const Star = styled.span`
  font-size: 1.5rem;
  color: ${({ $filled }) => $filled ? '#FFD700' : '#ccc'};
  cursor: pointer;
`;
const CommentsArea = styled.textarea`
  width: 100%;
  min-height: 60px;
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 0.7rem;
  margin: 0.5rem 0;
  font-size: 1rem;
`;
const SaveBtn = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-weight: 500;
  font-size: 1rem;
  margin-top: 0.7rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(79, 138, 139, 0.09);
  transition: background 0.2s, transform 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.accent};
    transform: scale(1.05);
  }
`;



// ...existing styled components...

function Estante({ livros, carregarLivros }) {
  console.log('Livros recebidos na estante:', livros);
  const [modalLivro, setModalLivro] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [filtroFavoritos, setFiltroFavoritos] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');

  // Removido: carregarLivros e useEffect

  const removerLivro = async (id) => {
    try {
      await deleteDoc(doc(db, 'books', id));
      setModalLivro(null);
  await carregarLivros();
    } catch (err) {
      alert('Erro ao remover livro.');
    }
  };

  const abrirModal = (livro) => {
    setModalLivro(livro);
    setEditData({
      status: livro.status || 'Quero ler',
      rating: livro.rating || 0,
      comments: livro.comments || '',
    });
    setShowFullDesc(false);
  };

  const fecharModal = () => {
    setModalLivro(null);
    setEditData(null);
    setShowFullDesc(false);
  };

  const salvarEdicao = async () => {
    if (!modalLivro) return;
    try {
      await updateDoc(doc(db, 'books', modalLivro.id), {
        status: editData.status || 'Quero ler',
        rating: typeof editData.rating === 'number' ? editData.rating : 0,
        comments: editData.comments || '',
      });
  await carregarLivros();
      fecharModal();
    } catch (err) {
      alert('Erro ao salvar edição.');
    }
  };

  // Função para limitar texto
  const getLimitedText = (text, lines = 5) => {
    if (!text) return '';
    const arr = text.split('\n').join(' ').split(' ');
    if (arr.length < 30) return text;
    return arr.slice(0, 30).join(' ') + '...';
  };

  const livrosArray = Array.isArray(livros) ? livros : [];
  // Filtros
  let livrosFiltrados = livrosArray;
  if (filtroFavoritos) {
    livrosFiltrados = livrosFiltrados.filter(livro => livro.favorito);
  }
  if (filtroStatus) {
    livrosFiltrados = livrosFiltrados.filter(livro => livro.status === filtroStatus);
  }
  // Função para favoritar/desfavoritar
  const alternarFavorito = async (livro) => {
    try {
      await updateDoc(doc(db, 'books', livro.id), {
        favorito: !livro.favorito
      });
      await carregarLivros();
    } catch (err) {
      alert('Erro ao favoritar livro.');
    }
  };
  return (
    <EstanteWrapper>
      <h2>Minha Estante</h2>
      <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap'}}>
        <button className="btn-base" onClick={() => setFiltroFavoritos(f => !f)}>
          {filtroFavoritos ? 'Mostrar todos' : 'Mostrar só favoritos'}
        </button>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{padding:'0.5rem',borderRadius:'8px',border:'1px solid #ddd'}}>
          <option value="">Todos os status</option>
          <option value="Quero ler">Quero ler</option>
          <option value="Lendo">Lendo</option>
          <option value="Lido">Lido</option>
        </select>
      </div>
      {livrosFiltrados.length === 0 && <p>Nenhum livro encontrado.</p>}
      <CardsGrid>
        {livrosFiltrados.map(livro => (
          <LivroCard key={livro.id} onClick={() => abrirModal(livro)}>
            <Cover src={livro.cover || ''} alt={livro.title} />
            <Title>{livro.title}</Title>
            <StatusTag>{livro.status || 'Quero ler'}</StatusTag>
            <button
              style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.3rem',marginTop:'0.3rem'}}
              title={livro.favorito ? 'Desfavoritar' : 'Favoritar'}
              onClick={e => {e.stopPropagation(); alternarFavorito(livro);}}
            >{livro.favorito ? '★' : '☆'}</button>
          </LivroCard>
        ))}
      </CardsGrid>

      {modalLivro && (
        <ModalOverlay onClick={fecharModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseBtn onClick={fecharModal}>×</CloseBtn>
            <Cover src={modalLivro.cover || ''} alt={modalLivro.title} style={{marginBottom: '1rem'}} />
            <Title>{modalLivro.title}</Title>
            <div><b>Autor(es):</b> {modalLivro.authors}</div>
            <div style={{margin: '0.5rem 0'}}>
              <b>Descrição:</b> <br />
              {!showFullDesc ? (
                <>
                  <span style={{display:'-webkit-box', WebkitLineClamp:5, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                    {getLimitedText(modalLivro.description, 5)}
                  </span>
                  {modalLivro.description && modalLivro.description.length > 120 && (
                    <button style={{background:'none',color:'#4F8A8B',border:'none',cursor:'pointer',fontWeight:'bold',marginLeft:'5px'}} onClick={()=>setShowFullDesc(true)}>Ler mais</button>
                  )}
                </>
              ) : (
                <>
                  <span>{modalLivro.description}</span>
                  <button style={{background:'none',color:'#4F8A8B',border:'none',cursor:'pointer',fontWeight:'bold',marginLeft:'5px'}} onClick={()=>setShowFullDesc(false)}>Mostrar menos</button>
                </>
              )}
            </div>
            <div>
              <b>Status:</b>
              <StatusSelect value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                <option value="Quero ler">Quero ler</option>
                <option value="Lendo">Lendo</option>
                <option value="Lido">Lido</option>
              </StatusSelect>
            </div>
            <div>
              <b>Avaliação:</b>
              <RatingStars>
                {[1,2,3,4,5].map(star => (
                  <Star
                    key={star}
                    $filled={editData.rating >= star}
                    onClick={e => {
                      e.stopPropagation();
                      setEditData({...editData, rating: star});
                    }}
                    style={{cursor:'pointer'}}
                  >★</Star>
                ))}
              </RatingStars>
            </div>
            <div>
              <b>Comentários:</b>
              <CommentsArea value={editData.comments} onChange={e => setEditData({...editData, comments: e.target.value})} placeholder="Escreva seu comentário..." />
            </div>
            <SaveBtn onClick={e => {e.stopPropagation(); salvarEdicao();}}>Salvar</SaveBtn>
            <RemoveButton onClick={e => {e.stopPropagation(); removerLivro(modalLivro.id);}}>Remover Livro</RemoveButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </EstanteWrapper>
  );
}

export default Estante;
