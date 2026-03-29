require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json());

// Rota de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API está funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Rotas da aplicação
app.use("/api", authRoutes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// Middleware global de erros
app.use((err, req, res, next) => {
  console.error(`[ERRO] ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor.",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});