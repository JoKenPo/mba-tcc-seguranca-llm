'use strict';

/**
 * Input validation utilities.
 * Centralising validation keeps routes clean and rules consistent.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a registration payload.
 * @param {object} body - Request body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRegister(body) {
  const errors = [];
  const { name, email, password } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (name && name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a login payload.
 * @param {object} body - Request body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLogin(body) {
  const errors = [];
  const { email, password } = body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateRegister, validateLogin };