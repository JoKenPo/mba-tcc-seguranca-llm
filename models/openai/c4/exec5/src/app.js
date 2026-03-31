import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.js';
import errorHandler from './middleware/errorHandler.js';

// Carrega variáveis de ambiente
dotenv.config();

const {
  PORT = 3000,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS,
} = process.env;

// Validação mínima das variáveis críticas
if (!JWT_SECRET) {
  console.error('❌ ERRO: JWT_SECRET não definido no .env');
  process.exit(1);
}
if (!JWT_EXPIRES_IN) {
  console.error('❌ ERRO: JWT_EXPIRES_IN não definido no .env');
  process.exit(1);
}
if (!BCRYPT_SALT_ROUNDS) {
  console.error('❌ ERRO: BCRYPT_SALT_ROUNDS não definido no .env');
  process.exit(1);
}

const app = express();

// Middlewares globais
app.use(helmet());                     // Headers de segurança
app.use(cors({ origin: '*' }));        // Ajuste em produção
app.use(express.json());               // Parse JSON

// Rate limiting (100 req/15min por IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas
app.use('/', authRouter);

// Tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

// Inicia o servidor
app.listen(PORT, () => {
  console.info(`🚀 API rodando em http://localhost:${PORT}`);
});