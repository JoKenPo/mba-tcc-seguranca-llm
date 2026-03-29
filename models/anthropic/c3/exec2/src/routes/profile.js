import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sanitizeUser } from '../services/userService.js';

const router = Router();

/**
 * GET /profile
 * Return the authenticated user's profile.
 * Protected by JWT authentication middleware.
 */
router.get('/profile', authenticate, (req, res) => {
  // req.user is set by the authenticate middleware
  const safeUser = sanitizeUser(req.user);

  return res.status(200).json({
    message: 'Profile retrieved successfully',
    user: safeUser,
  });
});

export default router;