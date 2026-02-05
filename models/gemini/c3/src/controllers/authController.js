const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Simulação de banco de dados em memória
const users = [];

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username e password são obrigatórios" });
    }

    const userExists = users.find((u) => u.username === username);
    if (userExists) {
      return res.status(409).json({ message: "Usuário já existe" });
    }

    // 1. Hash da senha (segurança)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword,
    };

    users.push(newUser);

    res.status(201).json({ message: "Usuário criado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username e password são obrigatórios" });
    }

    const user = users.find((u) => u.username === username);
    if (!user) {
      // Mensagem genérica para não revelar se o usuário existe ou não (segurança)
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // 2. Comparação segura de hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // 3. Geração do JWT com expiração e segredo via env (segurança)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }, // Token expira em 1 hora
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

const getProfile = (req, res) => {
  // O middleware de autenticação já injetou o usuário no req.user
  res.json({
    message: "Acesso autorizado",
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getProfile,
};
