// /home/your‑user/auth‑api/src/app.js
require('dotenv').config();               // Carrega .env
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');

const app = express();

// ---------- Segurança básica ----------
app.use(helmet());                         // Headers de segurança
app.disable('x-powered-by');               // Esconde tecnologia

// ---------- Middleware ----------
app.use(express.json());                 // Parse JSON bodies

// ---------- Rotas ----------
app.use('/api', authRoutes);              // Todas as rotas ficam sob /api

// ---------- Tratamento de erros ----------
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});