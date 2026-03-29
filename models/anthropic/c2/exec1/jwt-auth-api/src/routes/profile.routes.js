const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const profileController = require('../controllers/profile.controller');

const router = Router();

/**
 * @route  GET /profile
 * @desc   Retorna os dados do usuário autenticado
 * @access Private (requer Bearer token)
 */
router.get('/profile', authMiddleware, profileController.getProfile);

module.exports = router;