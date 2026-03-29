'use strict';

const { Router } = require('express');
const { createUser, verifyCredentials } = require('../services/userService');
const { generateToken } = require('../services/tokenService');
const { validateRegister, validateLogin } = require('../utils/validators');
const { authRateLimit } = require('../middleware/security');

const router = Router();

/**
 * POST /register
 *
 * Creates a new user account.
 *
 * Body: { name, email, password }
 * Returns: { success, message, data: { user, token } }
 */
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { valid, errors } = validateRegister(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const { name, email, password } = req.body;
    const user = await createUser({ name, email, password });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'An unexpected error occurred.',
    });
  }
});

/**
 * POST /login
 *
 * Authenticates a user and returns a JWT.
 *
 * Body: { email, password }
 * Returns: { success, message, data: { user, token } }
 */
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { valid, errors } = validateLogin(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const { email, password } = req.body;
    const user = await verifyCredentials(email, password);
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'An unexpected error occurred.',
    });
  }
});

module.exports = router;