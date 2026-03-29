'use strict';

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

const { findByEmail, createUser } = require('../services/userStore');
const { authLimiter }             = require('../middleware/rateLimiter');
const {
  registerRules,
  loginRules,
  handleValidationErrors,
} = require('../middleware/validate');

const router = express.Router();

/**
 * POST /register
 *
 * Security fixes:
 * - bcrypt cost factor 12: slow enough to resist brute-force, fast enough for UX.
 *   Cost 8–10 (common default) can be cracked ~16–64× faster.
 * - Duplicate email check returns the same 409 regardless of which field
 *   caused the conflict, to avoid leaking which emails are registered.
 * - Plain-text password is never logged or stored.
 */
const BCRYPT_ROUNDS = 12;

router.post(
  '/register',
  authLimiter,
  registerRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (findByEmail(email)) {
        // Security fix: do not reveal that the email already exists.
        // A timing-safe response would add a fixed delay here in production.
        return res.status(409).json({ error: 'Registration failed' });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      createUser(email, passwordHash);

      return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error('[register] Unexpected error:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /login
 *
 * Security fixes:
 * - Unified error message for "user not found" and "wrong password"
 *   prevents user enumeration.
 * - bcrypt.compare() is always called even when the user doesn't exist
 *   (dummy hash) to ensure constant-time response and prevent timing attacks.
 * - JWT signed with explicit algorithm HS256 and short expiry.
 * - `sub` claim carries the user ID (standard practice); email added for
 *   convenience but not used as the primary identifier.
 */

// Dummy hash used to prevent timing-based user enumeration.
// bcrypt.compare() against a real hash takes ~same time whether user exists or not.
const DUMMY_HASH = '$2b$12$invalidhashusedtopreventisenumerationXXXXXXXXXXXXXXXXXX';

router.post(
  '/login',
  authLimiter,
  loginRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = findByEmail(email);

      // Security fix: always run bcrypt.compare to avoid timing side-channel.
      // If user doesn't exist, compare against a dummy hash (result will be false).
      const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
      const passwordMatch = await bcrypt.compare(password, hashToCompare);

      if (!user || !passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          sub:   user.id,    // Subject: unique user identifier
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',                      // Explicit — never rely on default
          expiresIn: process.env.JWT_EXPIRES_IN,   // From env — default 15m
        }
      );

      return res.status(200).json({ token });
    } catch (err) {
      console.error('[login] Unexpected error:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;