// src/controllers/auth.controller.js
const userService = require('../services/user.service');
const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação simples
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const existing = await userService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Usuário já cadastrado' });
    }

    const newUser = await userService.createUser(email, password);
    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const passwordMatch = await authService.comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = authService.generateToken({ id: user.id, email: user.email });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno' });
  }
};