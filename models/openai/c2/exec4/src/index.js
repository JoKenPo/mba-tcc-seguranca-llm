// src/index.js
const express = require('express');
const bodyParser = require('express').json;
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser());

// Rotas
app.use('/register', authRoutes);
app.use('/login', authRoutes);
app.use('/profile', profileRoutes);

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});