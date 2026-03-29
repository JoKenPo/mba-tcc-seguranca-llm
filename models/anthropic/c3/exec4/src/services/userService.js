import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";

// In-memory store — replace with a real DB in production
const users = [];

/**
 * Finds a user by email address.
 * Returns undefined if not found.
 */
export function findUserByEmail(email) {
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Finds a user by their unique ID.
 * Returns undefined if not found.
 */
export function findUserById(id) {
  return users.find((user) => user.id === id);
}

/**
 * Creates a new user with a hashed password.
 * Returns the user object without the password hash.
 * Throws if the email is already registered.
 */
export async function createUser({ name, email, password }) {
  if (findUserByEmail(email)) {
    const error = new Error("Email already registered");
    error.code = "EMAIL_TAKEN";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Never return the password hash
  return sanitizeUser(user);
}

/**
 * Verifies credentials and returns the user if valid.
 * Returns null on any failure to prevent user enumeration.
 */
export async function verifyCredentials(email, password) {
  const user = findUserByEmail(email);

  // Always run bcrypt even if user not found to prevent timing attacks
  const hashToCompare = user?.passwordHash ?? "$2a$12$invalidhashfortimingattack000";
  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    return null;
  }

  return sanitizeUser(user);
}

/**
 * Strips sensitive fields before returning user data.
 */
export function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}