// controllers/profileController.js
const { findUserById } = require('../services/userService');

/**
 * GET /profile
 * Header: Authorization: Bearer <token>
 */
function getProfile(req, res) {
  // O middleware de autenticação já adicionou `req.user`
  const user = findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ profile: userWithoutPassword });
}

module.exports = { getProfile };