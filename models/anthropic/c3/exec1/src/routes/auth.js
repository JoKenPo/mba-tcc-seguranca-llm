import { Router } from 'express';
import { createUser, verifyCredentials } from '../services/userService.js';
import { generateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

// Apply the strict rate limiter to all auth routes
router.use(authRateLimiter);

/**
 * POST /register
 * Body: { name, email, password }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // --- Input validation ---
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation Error', messages: errors });
    }

    const user = await createUser({ name, email, password });

    const token = generateToken({ sub: user.id, email: user.email });

    return res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return res
        .status(409)
        .json({ error: 'Conflict', message: err.message });
    }
    next(err);
  }
});

/**
 * POST /login
 * Body: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Validation Error', message: 'Email and password are required' });
    }

    const user = await verifyCredentials(email, password);

    const token = generateToken({ sub: user.id, email: user.email });

    return res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: err.message });
    }
    next(err);
  }
});

export default router;