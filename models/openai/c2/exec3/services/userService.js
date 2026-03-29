// services/userService.js
const bcrypt = require('bcryptjs');

// Armazenamento em memória
const users = [];

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password - senha em texto puro
 * @returns {object} usuário criado (sem a senha hash)
 */
async function createUser(email, password) {
  // Verifica se já existe
  const exists = users.find(u => u.email === email);
  if (exists) {
    throw new Error('Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, email, passwordHash };
  users.push(user);
  // Retorna objeto sem a hash da senha
  const { passwordHash: _, ...userWithoutPass } = user;
  return userWithoutPass;
}

/**
 * Busca usuário por email.
 * @param {string} email
 * @returns {object|null}
 */
function findByEmail(email) {
  return users.find(u => u.email === email) || null;
}

/**
 * Busca usuário por ID.
 * @param {number} id
 * @returns {object|null}
 */
function findById(id) {
  return users.find(u => u.id === id) || null;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
};