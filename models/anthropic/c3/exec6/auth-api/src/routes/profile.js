'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');

const router = Router();

/**
 * GET /profile
 *
 * Returns the authenticated user's profile.
 * Requires a valid Bearer token in the Authorization header.
 *
 * Headers: { Authorization: "Bearer <token>" }
 * Returns: { success, data: { user } }
 */
router.get('/profile', authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully.',
    data: {
      user: req.user,
    },
  });
});

module.exports = router;