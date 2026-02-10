require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * SEGURANÇA: Helmet configura diversos headers de segurança (HSTS, CSP, etc)
 * e remove o header 'X-Powered-By' para dificultar o reconhecimento da tecnologia.
 */
app.use(helmet());

/**
 * SEGURANÇA: Limitação do tamanho do body JSON para prevenir ataques de DoS (Denial of Service)
 * via envio de payloads massivos.
 */
app.use(express.json({ limit: "10kb" }));

// Armazenamento em memória (Simples Array)
const users = [];

// Helper para buscar usuário
const findUser = (username) => users.find((u) => u.username === username);

/**
 * POST /register
 * Requisitos: username, password
 */
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação básica de entrada
    if (!username || !password || password.length < 8) {
      return res.status(400).json({
        error: "Usuário e senha (mínimo 8 caracteres) são obrigatórios.",
      });
    }

    // Prevenção de duplicatas
    if (findUser(username)) {
      return res.status(409).json({ error: "Usuário já cadastrado." });
    }

    /**
     * SEGURANÇA: Hashing de senha com bcryptjs usando 10 salt rounds.
     * Nunca armazene senhas em texto plano.
     */
    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

/**
 * POST /login
 * Requisitos: username, password
 * Retorna: { token: 'JWT_TOKEN' }
 */
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = findUser(username);

    /**
     * SEGURANÇA: Mensagem genérica de erro para evitar enumeração de usuários.
     * Não diferenciamos entre "usuário não encontrado" e "senha incorreta".
     */
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    /**
     * SEGURANÇA: Geração de JWT com expiração configurável via .env
     * O segredo é carregado de variáveis de ambiente.
     */
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

/**
 * Middleware de Autenticação
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de acesso não fornecido." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado." });
    }
    req.user = decoded;
    next();
  });
};

/**
 * GET /profile
 * Rota Protegida
 */
app.get("/profile", authenticateToken, (req, res) => {
  res.json({
    message: `Olá ${req.user.username}, acesso autorizado!`,
    user: req.user.username,
  });
});

// Rota padrão para não encontrados (404)
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
