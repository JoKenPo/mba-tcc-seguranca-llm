// controllers/authController.js
const userService = require('../services/userService');
const authService = require('../services/authService');

/**
 * POST /register
 */
async function register(req, res) {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const newUser = await userService.createUser(email, password);
    return res.status(201).json({ message: 'Usuário criado', user: newUser });
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
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const token = await authService.login(email, password);
    return res.json({ token });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
}

module.exports = {
  register,
  login,
};