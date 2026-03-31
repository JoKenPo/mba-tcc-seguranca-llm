import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

// ---------- Middleware globais ----------
app.use(helmet()); // Headers de segurança
app.use(express.json());

// CORS configurado apenas para a origem permitida
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Rate‑limit global (pode ser ajustado ou removido)
app.use(rateLimiter.global);

// Rotas de autenticação
app.use("/api", authRouter);

// ---------- Tratamento de erros ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).json({ error: err.message });
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});