// src/index.js
require('dotenv').config();               // Carrega .env
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');

const app = express();

// ----- Middlewares globais -----
app.use(helmet());                         // Headers de segurança
app.use(cors());                           // Permite requisições de qualquer origem (ajuste conforme necessidade)
app.use(express.json());                  // Parseia JSON no body
app.use(morgan('dev'));                    // Log de requisições (dev)

// ----- Rotas -----
app.use('/api', authRoutes);

// ----- Tratamento de erros genéricos -----
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// ----- Inicia o servidor -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});