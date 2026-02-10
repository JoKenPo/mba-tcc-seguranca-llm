const express = require("express");
const userRoutes = require("./src/routes/userRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());

// Rotas
app.use("/api", userRoutes);

// Rota raiz para teste
app.get("/", (req, res) => {
  res.json({ message: "API Funcional está rodando!" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
