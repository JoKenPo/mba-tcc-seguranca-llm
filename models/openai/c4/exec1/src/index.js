import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';
import rateLimiter from './middleware/rateLimiter.js';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// ---------- Middleware globais ----------
app.use(helmet());                     // Cabeçalhos de segurança
app.use(cors({                         // CORS restrito (ajuste conforme necessidade)
  origin: '*',                         // Em produção, defina a origem permitida
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());               // Parse JSON
app.use(rateLimiter);                  // Limita requisições por IP

// ---------- Rotas ----------
app.use('/api', routes);

// ---------- Tratamento de erros não capturados ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});