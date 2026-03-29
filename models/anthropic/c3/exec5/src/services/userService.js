// In-memory storage — replace with a real DB in production
const users = [];

/**
 * Finds a user by their email address.
 * @param {string} email
 * @returns {object|undefined} The user object or undefined if not found.
 */
export function findUserByEmail(email) {
  return users.find((u) => u.email === email.toLowerCase().trim());
}

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {object|undefined} The user object or undefined if not found.
 */
export function findUserById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Creates a new user and stores them in memory.
 * @param {object} userData - Object containing name, email, and hashedPassword.
 * @returns {object} The newly created user (without the password hash).
 */
export function createUser({ name, email, hashedPassword }) {
  const newUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Return user without the password hash
  const { password, ...safeUser } = newUser;
  return safeUser;
}