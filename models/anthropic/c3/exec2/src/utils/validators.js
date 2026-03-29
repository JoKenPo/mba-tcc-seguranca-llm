/**
 * Validate registration input fields.
 * Returns an array of error messages (empty if valid).
 * @param {object} body
 * @returns {string[]}
 */
export function validateRegisterInput({ name, email, password }) {
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return errors;
}

/**
 * Validate login input fields.
 * @param {object} body
 * @returns {string[]}
 */
export function validateLoginInput({ email, password }) {
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  return errors;
}