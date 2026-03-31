// /home/user/api/app.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();

// ---------- Segurança de cabeçalhos ----------
app.use(helmet());

// ---------- CORS (ajuste conforme necessidade) ----------
app.use(cors({
  origin: '*', // Em produção, restrinja ao domínio da sua aplicação
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---------- Limite de taxa (prevenção contra brute‑force) ----------
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
app.use('/api/', apiLimiter);

// ---------- Body parser ----------
app.use(express.json());

// ---------- Rotas ----------
app.use('/api', authRoutes);

// ---------- Tratamento de erros genéricos ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).json({ error: err.message || 'Erro interno do servidor' });
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});