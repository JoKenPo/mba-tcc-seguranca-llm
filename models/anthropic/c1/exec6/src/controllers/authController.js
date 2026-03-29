const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

/**
 * POST /api/register
 * Cadastra um novo usuário.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Os campos name, email e password são obrigatórios.",
      });
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    // Validação de senha mínima
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "A senha deve ter no mínimo 6 caracteres." });
    }

    // Verifica se o e-mail já está cadastrado
    const existingUser = userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const user = await userService.createUser(name, email, password);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/login
 * Autentica o usuário e retorna um token JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Os campos email e password são obrigatórios." });
    }

    // Verifica se o usuário existe
    const user = userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Valida a senha
    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profile
 * Retorna os dados do usuário autenticado (rota protegida).
 */
const profile = (req, res) => {
  const user = userService.findByEmail(req.user.email);
  const { password, ...userWithoutPassword } = user;

  return res.status(200).json({
    message: "Acesso autorizado!",
    user: userWithoutPassword,
  });
};

/**
 * GET /api/users
 * Lista todos os usuários cadastrados (rota protegida).
 */
const listUsers = (req, res) => {
  const users = userService.getAllUsers();

  return res.status(200).json({
    total: users.length,
    users,
  });
};

module.exports = { register, login, profile, listUsers };