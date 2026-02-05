const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authRoutes);
app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.send("API REST com Node.js e Express rodando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
