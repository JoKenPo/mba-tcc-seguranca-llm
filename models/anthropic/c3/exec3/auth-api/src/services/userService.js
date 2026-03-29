import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";

// In-memory store — replace with a real database in production
const users = [];

/**
 * Finds a user by their email address.
 * @param {string} email
 * @returns {object|undefined}
 */
const findByEmail = (email) =>
  users.find((u) => u.email === email.toLowerCase().trim());

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {object|undefined}
 */
const findById = (id) => users.find((u) => u.id === id);

/**
 * Creates a new user with a hashed password.
 * @param {string} name
 * @param {string} email
 * @param {string} password - Plain-text password (will be hashed)
 * @returns {object} - Safe user object (no password hash)
 */
const createUser = async (name, email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (findByEmail(normalizedEmail)) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Never return the password hash
  return toSafeUser(user);
};

/**
 * Validates credentials and returns the user if valid.
 * @param {string} email
 * @param {string} password
 * @returns {object} - Safe user object
 */
const validateCredentials = async (email, password) => {
  const user = findByEmail(email);

  // Always run bcrypt.compare to prevent timing attacks,
  // even when the user doesn't exist
  const dummyHash =
    "$2a$12$invalidhashusedtopreventtimingattacksXXXXXXXXXXXXXXXXXX";
  const isValid = await bcrypt.compare(
    password,
    user?.passwordHash ?? dummyHash
  );

  if (!user || !isValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return toSafeUser(user);
};

/**
 * Returns a user object without sensitive fields.
 * @param {object} user
 * @returns {object}
 */
const toSafeUser = ({ id, name, email, createdAt }) => ({
  id,
  name,
  email,
  createdAt,
});

export const userService = {
  findById,
  createUser,
  validateCredentials,
  toSafeUser,
};