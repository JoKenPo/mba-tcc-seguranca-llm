const { Router } = require('express');
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

/**
 * @route  GET /profile
 * @desc   Get authenticated user's profile
 * @access Private (requires Bearer token)
 */
router.get('/profile', authMiddleware, profileController.getProfile);

module.exports = router;