require('dotenv').config(); // Carrega .env
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// ---------- Middleware globais ----------
app.use(helmet());                     // Headers de segurança
app.use(express.json());               // Parse JSON body
app.disable('x-powered-by');           // Remove header que indica que é Express

// ---------- Rotas ----------
app.use('/', authRoutes);              // /register e /login
app.use('/', profileRoutes);           // /profile (protegida)

// ---------- Tratamento de rotas não encontradas ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ---------- Tratamento de erros ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});