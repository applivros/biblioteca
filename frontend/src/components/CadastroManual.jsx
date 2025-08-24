import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import styled from 'styled-components';


const FormWrapper = styled.div`
  background: ${({ theme }) => theme.colors.secondary};
  padding: 2rem 1rem 1rem 1rem;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(251, 212, 109, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeIn 0.7s ease;
  max-width: 500px;
  margin: 0 auto;
  @media (max-width: 700px) {
    padding: 1rem 0.3rem;
    max-width: 98vw;
  }
`;
const Input = styled.input`
  margin: 0.5rem 0;
  padding: 0.7rem 1rem;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  box-sizing: border-box;
`;
const TextArea = styled.textarea`
  margin: 0.5rem 0;
  padding: 0.7rem 1rem;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  box-sizing: border-box;
`;
const Button = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 0.5rem;
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

function CadastroManual({ carregarLivros }) {
  const [form, setForm] = useState({
    title: '',
    authors: '',
    description: '',
    cover: '',
    pages: '',
    status: 'Quero ler',
    file: null
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Simulação de upload (substitua por Firebase Storage se quiser)
  const uploadImage = async (file) => {
    // Aqui você pode integrar com Firebase Storage
    // Por enquanto, retorna uma URL fake
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('https://via.placeholder.com/120x180?text=Capa');
      }, 1200);
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setUploading(true);
    let coverUrl = form.cover;
    if (form.file) {
      coverUrl = await uploadImage(form.file);
    }
    try {
      await addDoc(collection(db, 'books'), {
        title: form.title,
        authors: form.authors,
        description: form.description,
        cover: coverUrl,
        pages: form.pages,
        status: form.status,
        added_by: 'manual',
        rating: 0,
        comments: ''
      });
      alert('Livro cadastrado com sucesso!');
      setForm({ title: '', authors: '', description: '', cover: '', pages: '', status: 'Quero ler', file: null });
      if (carregarLivros) {
        setTimeout(() => {
          carregarLivros();
        }, 500);
      }
    } catch (err) {
      alert('Erro ao cadastrar livro: ' + err.message);
      console.error(err);
    }
    setUploading(false);
  };

  return (
    <FormWrapper>
      <h2>Cadastrar Livro Manualmente</h2>
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
        <Input name="title" value={form.title} onChange={handleChange} placeholder="Título" required />
        <Input name="authors" value={form.authors} onChange={handleChange} placeholder="Autor(es)" />
        <TextArea name="description" value={form.description} onChange={handleChange} placeholder="Descrição" rows={3} />
        <Input name="pages" value={form.pages} onChange={handleChange} placeholder="Quantidade de páginas" type="number" min="1" style={{maxWidth:'180px'}} />
        <select name="status" value={form.status} onChange={handleChange} style={{padding:'0.7rem 1rem',borderRadius:'8px',border:'1px solid #ddd',fontSize:'1rem'}}>
          <option value="Quero ler">Quero ler</option>
          <option value="Lendo">Lendo</option>
          <option value="Lido">Lido</option>
        </select>
        <Input name="cover" value={form.cover} onChange={handleChange} placeholder="URL da capa (opcional)" />
        <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
          <label style={{fontSize:'0.98rem',color:'#555'}}>Ou faça upload da imagem da capa:</label>
          <input name="file" type="file" accept="image/*" onChange={handleChange} style={{padding:'0.3rem'}} />
        </div>
        <Button type="submit" disabled={uploading}>{uploading ? 'Cadastrando...' : 'Cadastrar'}</Button>
      </form>
    </FormWrapper>
  );
}

export default CadastroManual;
