const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

// ─── Gera um token JWT para o usuário ─────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

// ─── POST /api/register ───────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        required: ["name", "email", "password"],
      });
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido" });
    }

    // Validação de senha mínima
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "A senha deve ter no mínimo 6 caracteres" });
    }

    // Verifica se o e-mail já está cadastrado
    const existingUser = userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    const user = await userService.createUser({ name, email, password });
    const token = generateToken(user);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso",
      user,
      token,
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
};

// ─── POST /api/login ──────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        required: ["email", "password"],
      });
    }

    // Busca o usuário pelo e-mail
    const user = userService.findByEmail(email);
    if (!user) {
      // Mensagem genérica para não revelar se o e-mail existe
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Valida a senha
    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return res.status(200).json({
      message: "Login realizado com sucesso",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro ao realizar login" });
  }
};

// ─── GET /api/profile ─────────────────────────────────────────────────────────
const getProfile = (req, res) => {
  // req.user é preenchido pelo authMiddleware
  const user = userService.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const { password, ...userWithoutPassword } = user;

  return res.status(200).json({
    message: "Perfil obtido com sucesso",
    user: userWithoutPassword,
  });
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
const listUsers = (req, res) => {
  const users = userService.listUsers();

  return res.status(200).json({
    message: "Usuários listados com sucesso",
    total: users.length,
    users,
  });
};

module.exports = { register, login, getProfile, listUsers };