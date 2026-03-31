// controllers/authController.js
const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../services/userService');
const { generateToken } = require('../services/authService');

/**
 * POST /register
 * Body: { email, password }
 */
async function register(req, res) {
  const { email, password } = req.body;

  // validações básicas
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  // verifica se já existe
  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Usuário já cadastrado.' });
  }

  // hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = createUser({ email, password: hashedPassword });

  // não retornamos a senha
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ message: 'Usuário criado com sucesso.', user: userWithoutPassword });
}

/**
 * POST /login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const token = generateToken({ id: user.id, email: user.email });
  res.json({ token });
}

module.exports = { register, login };