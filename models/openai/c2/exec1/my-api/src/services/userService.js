// src/services/userService.js
const bcrypt = require('bcryptjs');

let users = []; // Armazenamento em memória

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password - senha em texto puro
 * @returns {object} usuário criado (sem a senha hash)
 */
async function createUser(email, password) {
  // Verifica se o e‑mail já existe
  const exists = users.find(u => u.email === email);
  if (exists) {
    throw new Error('Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    email,
    passwordHash,
  };
  users.push(newUser);
  // Retorna o usuário sem a hash da senha
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Busca um usuário pelo e‑mail.
 * @param {string} email
 * @returns {object|null}
 */
function findByEmail(email) {
  return users.find(u => u.email === email) || null;
}

/**
 * Busca um usuário pelo id.
 * @param {number} id
 * @returns {object|null}
 */
function findById(id) {
  return users.find(u => u.id === id) || null;
}

/**
 * Valida a senha informada comparando com o hash armazenado.
 * @param {object} user - objeto retornado por findByEmail
 * @param {string} passwordPlain
 * @returns {boolean}
 */
async function validatePassword(user, passwordPlain) {
  return bcrypt.compare(passwordPlain, user.passwordHash);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  validatePassword,
};