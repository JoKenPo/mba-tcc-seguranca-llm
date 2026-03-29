/**
 * In-memory store simulating a simple database using a JavaScript array.
 * All data is lost when the server restarts — suitable for development/demo only.
 */

const users = [];

/**
 * Returns all stored users (avoid exposing passwords externally).
 * @returns {Array} Full users array reference.
 */
const getUsers = () => users;

/**
 * Finds a user by their email address (case-insensitive).
 * @param {string} email
 * @returns {Object|undefined} The matched user object or undefined.
 */
const findUserByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase());

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {Object|undefined} The matched user object or undefined.
 */
const findUserById = (id) => users.find((u) => u.id === id);

/**
 * Inserts a new user into the in-memory store.
 * @param {Object} user - User object containing id, email, passwordHash, createdAt.
 * @returns {Object} The inserted user object.
 */
const insertUser = (user) => {
  users.push(user);
  return user;
};

module.exports = {
  getUsers,
  findUserByEmail,
  findUserById,
  insertUser,
};