// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '1h';

// POST /register
async function register(req, res) {
  const { email, password } = req.body;

  // Validações básicas
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  // Verifica se o usuário já existe
  const existingUser = userService.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: 'Usuário já cadastrado.' });
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Cria o usuário em memória
  const newUser = userService.createUser({ email, password: hashedPassword });

  // Não devolve a senha
  const { password: _, ...userWithoutPassword } = newUser;

  return res.status(201).json({ message: 'Usuário criado com sucesso.', user: userWithoutPassword });
}

// POST /login
async function login(req, res) {
  const { email, password } = req.body;

  // Validações básicas
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  const user = userService.findByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  // Gera token JWT
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return res.json({ token });
}

module.exports = {
  register,
  login,
};