const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();

// ----- Configurações de segurança -----
app.use(helmet());                     // Headers de segurança padrão
app.disable('x-powered-by');           // Esconde tecnologia do servidor
app.use(cors({ origin: '*', methods: ['GET','POST'] })); // Ajuste conforme necessidade

// ----- Middleware padrão -----
app.use(express.json());               // Parse JSON bodies

// ----- Rotas -----
app.use('/', authRoutes);

// ----- Tratamento de rotas não encontradas -----
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ----- Iniciar servidor -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});