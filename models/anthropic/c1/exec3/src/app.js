require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();

// --- Middlewares globais ---
app.use(express.json()); // Faz o parse do body JSON

// --- Rotas ---
app.use("/auth", authRoutes);

// Rota raiz — health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API no ar!" });
});

// --- Middleware de rota não encontrada ---
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// --- Middleware de erro global ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno no servidor." });
});

// --- Inicia o servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;