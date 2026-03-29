'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userStore = require('../store/userStore');
const config = require('../config/env');

/**
 * Handles user-related business logic.
 * Keeps routes thin and logic testable.
 */

/**
 * Creates a new user with a hashed password.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password - Plain-text password (will be hashed)
 * @returns {Promise<object>} The created user (without password hash)
 * @throws {Error} If the email is already registered
 */
async function createUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (userStore.findByEmail(normalizedEmail)) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  userStore.save(user);

  // Never return the password hash
  return sanitizeUser(user);
}

/**
 * Verifies credentials and returns the user if valid.
 * @param {string} email
 * @param {string} password - Plain-text password
 * @returns {Promise<object>} The authenticated user (without password hash)
 * @throws {Error} If credentials are invalid
 */
async function verifyCredentials(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = userStore.findByEmail(normalizedEmail);

  // Always run bcrypt.compare to prevent timing attacks,
  // even when the user doesn't exist.
  const dummyHash =
    '$2b$12$invalidhashusedtopreventtimingattacksXXXXXXXXXXXXXXXXXX';
  const hashToCompare = user ? user.passwordHash : dummyHash;

  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  return sanitizeUser(user);
}

/**
 * Retrieves a user by ID.
 * @param {string} id
 * @returns {object} The user (without password hash)
 * @throws {Error} If user is not found
 */
function getUserById(id) {
  const user = userStore.findById(id);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

/**
 * Removes sensitive fields before returning user data.
 * @param {object} user
 * @returns {object}
 */
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = { createUser, verifyCredentials, getUserById };