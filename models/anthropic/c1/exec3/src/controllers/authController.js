const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const store = require("../data/store");

// POST /auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // --- Validação dos campos ---
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Os campos name, email e password são obrigatórios.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    // --- Verifica se o e-mail já está em uso ---
    const emailAlreadyExists = store.users.some((u) => u.email === email);
    if (emailAlreadyExists) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    // --- Cria o usuário ---
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    // Retorna o usuário sem expor a senha
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      user: userWithoutPassword,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // --- Validação dos campos ---
    if (!email || !password) {
      return res.status(400).json({
        error: "Os campos email e password são obrigatórios.",
      });
    }

    // --- Verifica se o usuário existe ---
    const user = store.users.find((u) => u.email === email);
    if (!user) {
      // Mensagem genérica para não revelar se o e-mail existe
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // --- Verifica a senha ---
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // --- Gera o token JWT ---
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

// GET /auth/profile  (rota protegida)
function profile(req, res) {
  // req.user foi preenchido pelo authMiddleware
  const user = store.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const { password: _, ...userWithoutPassword } = user;
  return res.status(200).json({
    message: "Acesso autorizado.",
    user: userWithoutPassword,
  });
}

module.exports = { register, login, profile };