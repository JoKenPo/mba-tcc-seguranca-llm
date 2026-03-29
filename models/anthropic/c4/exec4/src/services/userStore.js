'use strict';

/**
 * In-memory user store.
 *
 * Security fix: the store exposes only the minimum necessary data.
 * Passwords (hashes) are never returned by publicProfile().
 * Each user receives a random UUID — never a sequential integer ID,
 * which would allow enumeration of total user count.
 */

const { randomUUID } = require('crypto');

const users = []; // In production, replace with a real database

/**
 * @param {string} email
 * @returns {object|undefined}
 */
function findByEmail(email) {
  // Normalise to lowercase to prevent duplicate accounts via case variation
  return users.find(u => u.email === email.toLowerCase());
}

/**
 * @param {string} email
 * @param {string} passwordHash  bcrypt hash — never the plain-text password
 * @returns {object} Public-safe user object
 */
function createUser(email, passwordHash) {
  const user = {
    id:           randomUUID(),
    email:        email.toLowerCase(),
    passwordHash, // Never exposed outside this module via publicProfile()
    createdAt:    new Date().toISOString(),
  };
  users.push(user);
  return publicProfile(user);
}

/**
 * Returns only the fields safe to expose outside this module.
 * @param {object} user
 * @returns {{ id: string, email: string, createdAt: string }}
 */
function publicProfile(user) {
  return {
    id:        user.id,
    email:     user.email,
    createdAt: user.createdAt,
  };
}

module.exports = { findByEmail, createUser, publicProfile };