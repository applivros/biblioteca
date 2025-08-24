import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./library.db');

// Rota de teste para inserir um livro manualmente
app.get('/api/test-insert-book', (req, res) => {
  db.run(`INSERT INTO books (google_id, title, authors, description, cover, added_by, status, rating, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['testid', 'Livro Teste', 'Autor Teste', 'Descrição teste', '', 'manual', 'Quero ler', 0, ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao inserir livro.' });
      res.json({ id: this.lastID });
    }
  );
});

// Rota temporária para criar a tabela books manualmente
app.get('/api/create-books-table', (req, res) => {
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT,
    title TEXT NOT NULL,
    authors TEXT,
    description TEXT,
    cover TEXT,
    added_by TEXT DEFAULT 'google',
    status TEXT DEFAULT 'Quero ler',
    rating INTEGER DEFAULT 0,
    comments TEXT DEFAULT ''
  )`, (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao criar tabela books.' });
    res.json({ success: true });
  });
});
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT,
  title TEXT NOT NULL,
  authors TEXT,
  description TEXT,
  cover TEXT,
  added_by TEXT DEFAULT 'google',
  status TEXT DEFAULT 'Quero ler',
  rating INTEGER DEFAULT 0,
  comments TEXT DEFAULT ''
)`);

// Cadastro de usuário
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  db.run(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, password],
    function (err) {
      if (err) return res.status(400).json({ error: 'E-mail já cadastrado ou erro no cadastro.' });
      res.json({ id: this.lastID });
    }
  );
});

// Login de usuário
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, user) => {
      if (err || !user) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      res.json({ id: user.id, name: user.name, email: user.email });
    }
  );
});

// Buscar livros na Google Books API
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`);
    res.json(response.data.items || []);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar livros.' });
  }
});

// Adicionar livro à estante
app.post('/api/books', (req, res) => {
  const { google_id, title, authors, description, cover, added_by } = req.body;
  db.run(
    `INSERT INTO books (google_id, title, authors, description, cover, added_by) VALUES (?, ?, ?, ?, ?, ?)`,
    [google_id, title, authors, description, cover, added_by || 'google'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao adicionar livro.' });
      res.json({ id: this.lastID });
    }
  );
});

// Cadastro manual de livro
app.post('/api/books/manual', (req, res) => {
  const { title, authors, description, cover } = req.body;
  db.run(
    `INSERT INTO books (title, authors, description, cover, added_by) VALUES (?, ?, ?, ?, 'manual')`,
    [title, authors, description, cover],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao cadastrar livro.' });
      res.json({ id: this.lastID });
    }
  );
});

// Listar livros da estante
app.get('/api/books', (req, res) => {
  db.all(`SELECT * FROM books ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar livros.' });
    res.json(rows);
  });
});

// Remover livro
app.delete('/api/books/:id', (req, res) => {
  db.run(`DELETE FROM books WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao remover livro.' });
    res.json({ success: true });
  });
});

// Editar livro (inclui status, rating, comments)
app.put('/api/books/:id', (req, res) => {
  console.log('PUT /api/books/:id', req.body, req.params.id);
  const { status, rating, comments } = req.body;
  db.run(
    `UPDATE books SET status = ?, rating = ?, comments = ? WHERE id = ?`,
    [status, rating, comments, req.params.id],
    function (err) {
      if (err) {
        console.error('Erro ao editar livro:', err);
        return res.status(500).json({ error: 'Erro ao editar livro.', details: err.message });
      }
      res.json({ success: true });
    }
  );
});

app.listen(4000, () => {
  console.log('API rodando em http://localhost:4000');
});
