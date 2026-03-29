import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';

// Carrega variáveis de ambiente
dotenv.config();

const {
  PORT = 3000,
  JWT_SECRET,
  JWT_EXPIRES_IN = '1h',
} = process.env;

// Verifica variáveis críticas
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET não definido no .env');
  process.exit(1);
}

const app = express();

// Middlewares globais
app.use(helmet()); // Headers de segurança
app.use(cors());   // Ajuste conforme necessidade (ex.: origin: 'https://myapp.com')
app.use(express.json());

// Rate limiting (100 reqs / 15 min por IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas
app.use('/api', authRoutes);
app.use('/api', profileRoutes);

// Tratamento de rotas não encontradas
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de erro genérico (não expõe stack trace)
app.use((err, _req, res, _next) => {
  console.error(err); // Log interno
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});