const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/inMemoryDb');
const jwtConfig = require('../config/jwt.config');

const SALT_ROUNDS = 10;

const authService = {
  /**
   * Registers a new user after validating input and checking for duplicates.
   *
   * @param {string} email    - User's email address
   * @param {string} password - Plain-text password (will be hashed)
   * @returns {{ id: string, email: string, createdAt: string }} Safe user object (no password)
   * @throws {Error} If email is already registered or input is invalid
   */
  async register(email, password) {
    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    if (!isValidEmail(email)) {
      const err = new Error('Invalid email format');
      err.status = 400;
      throw err;
    }

    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters long');
      err.status = 400;
      throw err;
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existingUser = db.findUserByEmail(email.toLowerCase());
    if (existingUser) {
      const err = new Error('Email is already registered');
      err.status = 409;
      throw err;
    }

    // ── Hash password & persist ───────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    db.insertUser(newUser);

    // Return safe user object (never expose the hashed password)
    return sanitizeUser(newUser);
  },

  /**
   * Validates credentials and returns a signed JWT on success.
   *
   * @param {string} email
   * @param {string} password
   * @returns {{ token: string, user: object }} JWT token and safe user data
   * @throws {Error} If credentials are invalid
   */
  async login(email, password) {
    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    // ── Look up user ──────────────────────────────────────────────────────────
    const user = db.findUserByEmail(email.toLowerCase());
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // ── Verify password ───────────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // ── Sign JWT ──────────────────────────────────────────────────────────────
    const payload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    return { token, user: sanitizeUser(user) };
  },

  /**
   * Retrieves a user's public profile by ID.
   *
   * @param {string} userId
   * @returns {{ id: string, email: string, createdAt: string }}
   * @throws {Error} If user is not found
   */
  getProfile(userId) {
    const user = db.findUserById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return sanitizeUser(user);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Removes sensitive fields from a user object before sending it to the client.
 * @param {object} user
 * @returns {{ id: string, email: string, createdAt: string }}
 */
function sanitizeUser({ id, email, createdAt }) {
  return { id, email, createdAt };
}

/**
 * Basic email format validation using a regular expression.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = authService;