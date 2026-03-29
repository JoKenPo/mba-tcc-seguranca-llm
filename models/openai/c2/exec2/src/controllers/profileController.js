// src/controllers/profileController.js
const { findById } = require('../services/userService');

/**
 * GET /profile
 * Requer autenticação via JWT.
 */
async function getProfile(req, res) {
  const userId = req.user.id;
  const user = findById(userId);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const { password, ...userWithoutPassword } = user;
  res.json({ profile: userWithoutPassword });
}

module.exports = {
  getProfile,
};