// src/controllers/userController.js
const userService = require('../services/userService');

/**
 * GET /profile
 * Requer autenticação (middleware authMiddleware)
 */
function getProfile(req, res) {
  // O middleware já adicionou req.user (payload do JWT)
  const user = userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  const { passwordHash, ...userData } = user;
  return res.json({ profile: userData });
}

module.exports = {
  getProfile,
};