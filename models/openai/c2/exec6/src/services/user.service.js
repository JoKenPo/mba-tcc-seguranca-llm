// src/services/user.service.js
const bcrypt = require('bcryptjs');

let users = []; // Armazenamento em memória
let nextId = 1;

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password - senha em texto puro
 * @returns {Promise<Object>}
 */
exports.createUser = async (email, password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: nextId++, email, passwordHash };
  users.push(user);
  return { id: user.id, email: user.email };
};

/**
 * Busca usuário pelo e‑mail.
 * @param {string} email
 * @returns {Promise<Object|undefined>}
 */
exports.findByEmail = async (email) => {
  return users.find((u) => u.email === email);
};

/**
 * Busca usuário pelo id.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
exports.findById = async (id) => {
  return users.find((u) => u.id === id);
};

/**
 * Limpa o armazenamento (útil para testes).
 */
exports._reset = () => {
  users = [];
  nextId = 1;
};