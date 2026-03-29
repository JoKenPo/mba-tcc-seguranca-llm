// app.js
const express = require('express');
const bodyParser = require('express').json;
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(bodyParser());

// Rotas
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});