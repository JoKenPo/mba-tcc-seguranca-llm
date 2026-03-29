const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findUserByEmail } = require("../store/inMemoryStore");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dev_key_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

/**
 * Validates credentials and returns a signed JWT on success.
 *
 * @param {string} email    - User's email address.
 * @param {string} password - Plain-text password to verify.
 * @returns {{ token: string, expiresIn: string }} JWT and its expiry label.
 * @throws {Error} If credentials are missing, invalid, or the user doesn't exist.
 */
const loginUser = async (email, password) => {
  // ── Basic input validation ───────────────────────────────────────────────────
  if (!email || !password) {
    const err = new Error("Email and password are required.");
    err.statusCode = 400;
    throw err;
  }

  // ── Look up user ─────────────────────────────────────────────────────────────
  const user = findUserByEmail(email);

  // Use a constant-time comparison to prevent user-enumeration via timing attacks.
  // We compare against a dummy hash when the user doesn't exist so the bcrypt
  // work factor is always paid regardless of whether the account exists.
  const DUMMY_HASH =
    "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  // ── Issue token ───────────────────────────────────────────────────────────────
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return { token, expiresIn: JWT_EXPIRES_IN };
};

/**
 * Verifies a JWT and returns its decoded payload.
 *
 * @param {string} token - Raw JWT string.
 * @returns {Object} Decoded payload ({ sub, email, iat, exp }).
 * @throws {Error} If the token is missing, malformed, or expired.
 */
const verifyToken = (token) => {
  if (!token) {
    const err = new Error("No token provided.");
    err.statusCode = 401;
    throw err;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (jwtError) {
    const err = new Error(
      jwtError.name === "TokenExpiredError"
        ? "Token has expired."
        : "Invalid token."
    );
    err.statusCode = 401;
    throw err;
  }
};

module.exports = { loginUser, verifyToken };