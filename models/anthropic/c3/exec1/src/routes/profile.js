import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /profile
 * Protected route — requires a valid Bearer token.
 */
router.get('/', requireAuth, (req, res) => {
  return res.status(200).json({
    message: 'Profile retrieved successfully',
    user: req.user,
  });
});

export default router;