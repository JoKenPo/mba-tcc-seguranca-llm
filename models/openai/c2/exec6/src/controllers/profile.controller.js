// src/controllers/profile.controller.js
const userService = require('../services/user.service');

exports.getProfile = async (req, res) => {
  // O middleware de autenticação já adicionou `req.user`
  const user = await userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  // Não retornamos a senha (hash)
  res.json({ id: user.id, email: user.email });
};