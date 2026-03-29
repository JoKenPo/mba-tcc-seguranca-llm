'use strict';

const { body, validationResult } = require('express-validator');

/**
 * Security fix: without input validation an attacker can send malformed data
 * that causes unexpected behaviour or crashes.
 *
 * Rules applied:
 * - Email is normalised (lowercase, trimmed) and checked for valid format.
 * - Password requires length 8–72 chars (72 is bcrypt's effective maximum),
 *   and at least one uppercase, one lowercase, one digit, one special char.
 *   This prevents trivially weak passwords without being overly restrictive.
 */

const registerRules = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 254 }) // RFC 5321 maximum
    .withMessage('Email too long'),

  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one special character'),
];

const loginRules = [
  body('email')
    .isEmail()
    .withMessage('Invalid credentials')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Invalid credentials')
    .isLength({ max: 72 })
    .withMessage('Invalid credentials'),
];

/**
 * Middleware that checks validation results and short-circuits with 422
 * if any rule failed.
 *
 * Security fix: validation errors for login use a generic message
 * to prevent user enumeration through field-level error detail.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = { registerRules, loginRules, handleValidationErrors };