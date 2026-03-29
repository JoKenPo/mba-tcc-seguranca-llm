const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const store = require("../data/store");

// POST /auth/register
async function register(req, res) {
  const { name, email, password } = req.body;

  // Validação básica dos campos
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Os campos name, email e password são obrigatórios." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "A senha deve ter pelo menos 6 caracteres." });
  }

  // Verifica se o e-mail já está cadastrado
  const emailAlreadyExists = store.users.some((user) => user.email === email);
  if (emailAlreadyExists) {
    return res.status(409).json({ error: "E-mail já cadastrado." });
  }

  // Gera o hash da senha antes de salvar
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: store.nextId++,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);

  // Retorna o usuário sem expor o hash da senha
  return res.status(201).json({
    message: "Usuário cadastrado com sucesso.",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
  });
}

// POST /auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Os campos email e password são obrigatórios." });
  }

  // Busca o usuário pelo e-mail
  const user = store.users.find((u) => u.email === email);
  if (!user) {
    // Mensagem genérica para não revelar se o e-mail existe ou não
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }

  // Compara a senha enviada com o hash armazenado
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }

  // Gera o token JWT com os dados públicos do usuário no payload
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return res.status(200).json({
    message: "Login realizado com sucesso.",
    token,
  });
}

// GET /auth/me  (rota protegida)
function me(req, res) {
  // req.user foi injetado pelo authMiddleware após validar o token
  const user = store.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}

// GET /users  (rota protegida - lista todos os usuários)
function listUsers(req, res) {
  const users = store.users.map(({ id, name, email, createdAt }) => ({
    id,
    name,
    email,
    createdAt,
  }));

  return res.status(200).json({ total: users.length, users });
}

module.exports = { register, login, me, listUsers };