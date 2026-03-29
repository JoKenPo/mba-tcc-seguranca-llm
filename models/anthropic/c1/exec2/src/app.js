require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares Globais ───────────────────────────────────────────────────────
app.use(express.json());

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use("/api", authRoutes);

// ─── Rota raiz ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "API de autenticação rodando!",
    endpoints: {
      register: "POST /api/register",
      login: "POST /api/login",
      profile: "GET /api/profile (requer token)",
      users: "GET /api/users (requer token)",
    },
  });
});

// ─── Handler de rotas não encontradas ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// ─── Handler de erros globais ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;