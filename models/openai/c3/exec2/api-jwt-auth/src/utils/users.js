// src/utils/users.js
// Simples "banco de dados" em memória.
// Cada usuário tem: id, username, passwordHash

const bcrypt = require('bcrypt');

let users = []; // array em memória

/**
 * Cria um novo usuário.
 * @param {string} username
 * @param {string} password - texto puro
 * @returns {Promise<object>} usuário criado (sem passwordHash)
 */
async function createUser(username, password) {
  const existing = users.find(u => u.username === username);
  if (existing) {
    throw new Error('Username already taken');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: users.length + 1,
    username,
    passwordHash,
  };
  users.push(user);
  // retornamos apenas os campos seguros
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Busca usuário por username.
 * @param {string} username
 * @returns {object|null}
 */
function findByUsername(username) {
  return users.find(u => u.username === username) || null;
}

/**
 * Busca usuário por id.
 * @param {number} id
 * @returns {object|null}
 */
function findById(id) {
  return users.find(u => u.id === id) || null;
}

/**
 * Valida a senha informada comparando com o hash armazenado.
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = {
  createUser,
  findByUsername,
  findById,
  verifyPassword,
};