import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env.js';

// In-memory store — replace with a real database in production
const users = new Map();

/**
 * Finds a user by their email address.
 * Returns undefined if not found.
 */
export function findUserByEmail(email) {
  return users.get(email.toLowerCase());
}

/**
 * Finds a user by their unique ID.
 * Returns undefined if not found.
 */
export function findUserById(id) {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

/**
 * Creates a new user with a hashed password.
 * Throws if the email is already registered.
 */
export async function createUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();

  if (users.has(normalizedEmail)) {
    const error = new Error('Email already registered');
    error.code = 'EMAIL_TAKEN';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.set(normalizedEmail, user);

  // Return a safe view — never expose the hash
  return toPublicUser(user);
}

/**
 * Verifies credentials and returns the user if valid.
 * Throws with a generic message to avoid user enumeration.
 */
export async function verifyCredentials(email, password) {
  const normalizedEmail = email.toLowerCase();
  const user = users.get(normalizedEmail);

  // Always run bcrypt.compare to prevent timing attacks,
  // even when the user doesn't exist
  const dummyHash =
    '$2a$12$invalidhashusedtopreventienuserenumeration00000000000000';
  const hashToCompare = user ? user.passwordHash : dummyHash;

  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    const error = new Error('Invalid email or password');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  return toPublicUser(user);
}

/**
 * Strips sensitive fields before sending user data to the client.
 */
export function toPublicUser(user) {
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}