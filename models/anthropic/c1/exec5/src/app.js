require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Faz o Express interpretar o body das requisições como JSON
app.use(express.json());

// Rota de health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API no ar!" });
});

// Registra todas as rotas de autenticação
app.use(authRoutes);

// Handler global para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Handler global de erros inesperados
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log("Rotas disponíveis:");
  console.log("  POST /auth/register");
  console.log("  POST /auth/login");
  console.log("  GET  /auth/me   [protegida]");
  console.log("  GET  /users     [protegida]");
});