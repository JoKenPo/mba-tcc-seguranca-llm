/**
 * In-Memory Database
 *
 * Simulates a database using a plain JavaScript array.
 * All data is lost when the server restarts — replace with
 * a real database (PostgreSQL, MongoDB, etc.) for production use.
 */

/** @type {Array<{ id: string, email: string, password: string, createdAt: string }>} */
const users = [];

const db = {
  /**
   * Returns all stored users.
   * @returns {Array} users array
   */
  getUsers() {
    return users;
  },

  /**
   * Finds a user by their email address.
   * @param {string} email
   * @returns {object|undefined}
   */
  findUserByEmail(email) {
    return users.find((user) => user.email === email);
  },

  /**
   * Finds a user by their unique ID.
   * @param {string} id
   * @returns {object|undefined}
   */
  findUserById(id) {
    return users.find((user) => user.id === id);
  },

  /**
   * Inserts a new user into the in-memory store.
   * @param {{ id: string, email: string, password: string, createdAt: string }} user
   * @returns {object} the inserted user
   */
  insertUser(user) {
    users.push(user);
    return user;
  },
};

module.exports = db;