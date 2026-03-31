// src/controllers/profileController.js
const userService = require('../services/userService');

function getProfile(req, res) {
  // O middleware de autenticação já adicionou `req.user`
  const user = userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  const { password, ...userWithoutPassword } = user;
  return res.json({ profile: userWithoutPassword });
}

module.exports = {
  getProfile,
};