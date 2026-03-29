// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // Em produção, use variável de ambiente
const JWT_EXPIRES_IN = '1h';

/**
 * POST /register
 */
async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const user = await userService.createUser(email, password);
    return res.status(201).json({ message: 'Usuário criado', user });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

/**
 * POST /login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email e senha são obrigatórios' });
  }

  const user = userService.findByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const isValid = await userService.validatePassword(user, password);
  if (!isValid) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return res.json({ token });
}

module.exports = {
  register,
  login,
};