// src/index.js
require('dotenv').config(); // carrega .env
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// -------------------------------------------------
// Segurança básica
// -------------------------------------------------
app.use(helmet()); // adiciona headers de segurança (CSP, HSTS, etc.)
app.disable('x-powered-by'); // remove header que revela o Express

// -------------------------------------------------
// Middlewares globais
// -------------------------------------------------
app.use(express.json()); // parse JSON bodies

// -------------------------------------------------
// Rotas
// -------------------------------------------------
app.use('/', authRoutes);      // /register e /login
app.use('/', profileRoutes);   // /profile (protege internamente)

// -------------------------------------------------
// Tratamento de rotas não encontradas
// -------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// -------------------------------------------------
// Inicialização
// -------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});