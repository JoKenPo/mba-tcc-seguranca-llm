'use strict';

/**
 * In-memory user store.
 * In production, replace this with a real database (PostgreSQL, MongoDB, etc.)
 *
 * This module is intentionally kept simple to demonstrate the auth flow
 * without adding database complexity.
 */

const users = [];

const userStore = {
  /**
   * Find a user by their email address.
   * @param {string} email
   * @returns {object|undefined}
   */
  findByEmail(email) {
    return users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  },

  /**
   * Find a user by their ID.
   * @param {string} id
   * @returns {object|undefined}
   */
  findById(id) {
    return users.find((user) => user.id === id);
  },

  /**
   * Persist a new user.
   * @param {object} user
   * @returns {object} The saved user
   */
  save(user) {
    users.push(user);
    return user;
  },

  /**
   * Returns the total number of registered users.
   * Useful for testing and health checks.
   * @returns {number}
   */
  count() {
    return users.length;
  },

  /**
   * Clears all users. Only used in tests.
   */
  _clear() {
    users.length = 0;
  },
};

module.exports = userStore;