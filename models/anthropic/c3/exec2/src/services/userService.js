import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';

// In-memory storage (replace with a database in production)
const users = new Map();

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {object|undefined}
 */
export function findUserByEmail(email) {
  for (const user of users.values()) {
    if (user.email === email.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

/**
 * Find a user by their ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function findUserById(id) {
  return users.get(id);
}

/**
 * Create a new user with a hashed password.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {object} The created user (without password hash)
 */
export async function createUser(name, email, password) {
  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.set(user.id, user);

  // Return user without sensitive data
  return sanitizeUser(user);
}

/**
 * Verify a plain-text password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Remove sensitive fields from a user object.
 * @param {object} user
 * @returns {object}
 */
export function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}