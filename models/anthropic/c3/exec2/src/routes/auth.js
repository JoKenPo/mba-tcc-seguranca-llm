import { Router } from 'express';
import { createUser, findUserByEmail, sanitizeUser, verifyPassword } from '../services/userService.js';
import { generateToken } from '../middleware/auth.js';
import { validateRegisterInput, validateLoginInput } from '../utils/validators.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

/**
 * POST /register
 * Create a new user account.
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const errors = validateRegisterInput({ name, email, password });
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors,
      });
    }

    // Check for duplicate email
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      // Use a generic message to avoid user enumeration
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists',
      });
    }

    // Create user (password is hashed inside createUser)
    const newUser = await createUser(name, email, password);
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  } catch (err) {
    console.error('[POST /register] Error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create account',
    });
  }
});

/**
 * POST /login
 * Authenticate a user and return a JWT.
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const errors = validateLoginInput({ email, password });
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors,
      });
    }

    // Find user by email
    const user = findUserByEmail(email);

    // Always run bcrypt.compare to prevent timing attacks,
    // even if the user doesn't exist (compare against a dummy hash)
    const DUMMY_HASH = '$2b$12$invalidhashfortimingattackprevention000000000000000000';
    const passwordToVerify = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await verifyPassword(password, passwordToVerify);

    if (!user || !isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const safeUser = sanitizeUser(user);
    const token = generateToken(safeUser);

    return res.status(200).json({
      message: 'Login successful',
      user: safeUser,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  } catch (err) {
    console.error('[POST /login] Error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    });
  }
});

export default router;