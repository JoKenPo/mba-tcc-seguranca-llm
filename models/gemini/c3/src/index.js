require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de Segurança e Middleware
app.use(helmet()); // Adiciona headers de segurança (req de segurança)
app.disable("x-powered-by"); // Remove header X-Powered-By (boa prática extra)
app.use(cors()); // Permite CORS
app.use(express.json()); // Parser de JSON
app.use(morgan("dev")); // Logger

// Rotas
app.use("/", routes);

// Rota base para teste
app.get("/", (req, res) => {
  res.send("API Segura Rodando. Use /register, /login ou /profile.");
});

// Middleware de tratamento de erro básico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
