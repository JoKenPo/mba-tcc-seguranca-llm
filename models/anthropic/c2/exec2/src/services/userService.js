/**
 * User Service
 *
 * Handles all user-related business logic and in-memory persistence.
 * The `users` array acts as our "database" for this example.
 */

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const config = require("../config/env");

// ---------------------------------------------------------------------------
// In-memory "database"
// ---------------------------------------------------------------------------
const users = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a safe user object (no password hash exposed).
 * @param {Object} user - Raw user record from the store.
 * @returns {Object} Public user fields.
 */
function sanitize(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Finds a user by their email address (case-insensitive).
 * @param {string} email
 * @returns {Object|undefined}
 */
function findByEmail(email) {
  return users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {Object|undefined}
 */
function findById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Creates a new user after validating uniqueness and hashing the password.
 *
 * @param {string} email    - User's email address.
 * @param {string} password - Plain-text password (will be hashed).
 * @returns {Promise<Object>} Sanitized newly created user.
 * @throws {Error} If the email is already registered.
 */
async function createUser(email, password) {
  if (findByEmail(email)) {
    const err = new Error("Email already registered.");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const newUser = {
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  return sanitize(newUser);
}

/**
 * Validates credentials and returns the sanitized user on success.
 *
 * @param {string} email
 * @param {string} password - Plain-text password to verify.
 * @returns {Promise<Object>} Sanitized user object.
 * @throws {Error} If credentials are invalid.
 */
async function validateCredentials(email, password) {
  const user = findByEmail(email);

  // Use a constant-time comparison to avoid timing attacks even when the
  // user does not exist (compare against a dummy hash).
  const dummyHash =
    "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
  const hashToCompare = user ? user.passwordHash : dummyHash;

  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  return sanitize(user);
}

/**
 * Returns the sanitized profile of a user by ID.
 *
 * @param {string} id
 * @returns {Object} Sanitized user object.
 * @throws {Error} If the user is not found.
 */
function getProfile(id) {
  const user = findById(id);

  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return sanitize(user);
}

/**
 * Returns the total number of registered users (useful for health checks /
 * admin endpoints).
 * @returns {number}
 */
function count() {
  return users.length;
}

module.exports = {
  createUser,
  validateCredentials,
  getProfile,
  findByEmail,
  findById,
  count,
};