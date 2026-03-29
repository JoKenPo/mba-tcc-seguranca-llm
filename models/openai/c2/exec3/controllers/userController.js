// controllers/userController.js
const userService = require('../services/userService');

/**
 * GET /profile
 * Requer autenticação (middleware já adicionou req.user)
 */
function getProfile(req, res) {
  const user = userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  const { passwordHash, ...userWithoutPass } = user;
  return res.json({ profile: userWithoutPass });
}

module.exports = {
  getProfile,
};