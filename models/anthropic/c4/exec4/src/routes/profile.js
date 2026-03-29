'use strict';

const express = require('express');
const { findByEmail, publicProfile } = require('../services/userStore');
const { authenticate }               = require('../middleware/authenticate');

const router = express.Router();

/**
 * GET /profile
 *
 * Protected route — requires a valid JWT.
 *
 * Security fix: user data is fetched fresh from the store on every request
 * using the ID from the verified token payload (req.user.id), not from
 * any client-supplied parameter. This prevents horizontal privilege escalation
 * where a user could request another user's profile by changing a query param.
 *
 * publicProfile() ensures the password hash is never included in the response.
 */
router.get('/profile', authenticate, (req, res) => {
  // Find user by email stored in the verified token
  // In a real DB you would query by req.user.id (the `sub` claim)
  const user = findByEmail(req.user.email);

  if (!user) {
    // Token was valid but user no longer exists (e.g., deleted account)
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(publicProfile(user));
});

module.exports = router;