const authService = require('../services/auth.service');

/**
 * Controller responsável por retornar o perfil do usuário autenticado.
 *
 * GET /profile
 * Header: Authorization: Bearer <token>
 *
 * O middleware de autenticação já validou o token e populou `req.user`
 * antes de este controller ser executado.
 */
function getProfile(req, res) {
  try {
    // req.user é injetado pelo authMiddleware após validação do JWT
    const result = authService.getUserProfile(req.user.id);

    return res.status(200).json({
      message: 'Profile retrieved successfully',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = { getProfile };