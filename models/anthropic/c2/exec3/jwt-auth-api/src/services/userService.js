const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const {
  findUserByEmail,
  findUserById,
  insertUser,
} = require("../store/inMemoryStore");

/** Number of bcrypt salt rounds — higher = more secure but slower. */
const SALT_ROUNDS = 10;

/**
 * Registers a new user after validating input and checking for duplicates.
 *
 * @param {string} email    - User's email address.
 * @param {string} password - Plain-text password (will be hashed).
 * @returns {Object} Safe user object (without passwordHash).
 * @throws {Error} If validation fails or email is already registered.
 */
const registerUser = async (email, password) => {
  // ── Validation ──────────────────────────────────────────────────────────────
  if (!email || !password) {
    const err = new Error("Email and password are required.");
    err.statusCode = 400;
    throw err;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const err = new Error("Invalid email format.");
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 6) {
    const err = new Error("Password must be at least 6 characters long.");
    err.statusCode = 400;
    throw err;
  }

  // ── Duplicate check ──────────────────────────────────────────────────────────
  const existing = findUserByEmail(email);
  if (existing) {
    const err = new Error("Email is already registered.");
    err.statusCode = 409;
    throw err;
  }

  // ── Persist ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = {
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  insertUser(newUser);

  // Return a safe representation (never expose the hash)
  return sanitizeUser(newUser);
};

/**
 * Retrieves a user's public profile by ID.
 *
 * @param {string} id - UUID of the user.
 * @returns {Object} Safe user object.
 * @throws {Error} If the user is not found.
 */
const getUserById = (id) => {
  const user = findUserById(id);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
};

/**
 * Strips sensitive fields before sending user data to the client.
 *
 * @param {Object} user - Raw user object from the store.
 * @returns {Object} User object without passwordHash.
 */
const sanitizeUser = ({ id, email, createdAt }) => ({ id, email, createdAt });

module.exports = { registerUser, getUserById };