/**
 * Validation Middleware
 *
 * Lightweight request-body validators that keep controllers clean.
 * Each validator calls `next()` on success or returns a 400 response
 * with a descriptive message on failure.
 */

// Simple email regex — good enough for an API layer
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the body of POST /register and POST /login.
 *
 * Rules:
 *  - `email`    required, must look like an email address
 *  - `password` required, minimum 6 characters
 */
function validateAuthBody(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  // --- email ---
  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push("Field 'email' is required.");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push("Field 'email' must be a valid email address.");
  }

  // --- password ---
  if (!password || typeof password !== "string" || !password.trim()) {
    errors.push("Field 'password' is required.");
  } else if (password.length < 6) {
    errors.push("Field 'password' must be at least 6 characters long.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  next();
}

module.exports = { validateAuthBody };