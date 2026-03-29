// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { createUser, findByEmail } = require('../services/userService');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * POST /register
 */
async function register(req, res) {
  const { email, password } = req.body;

  // Validações básicas
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  if (findByEmail(email)) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  const user = createUser(email, password);
  // Não retornamos a senha
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ message: 'Usuário criado', user: userWithoutPassword });
}

/**
 * POST /login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Payload mínimo
  const payload = { id: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
}

module.exports = {
  register,
  login,
};