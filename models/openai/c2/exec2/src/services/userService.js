// src/services/userService.js
let users = []; // Armazenamento em memória
let nextId = 1;

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password
 * @returns {{id:number,email:string,password:string}}
 */
function createUser(email, password) {
  const user = { id: nextId++, email, password };
  users.push(user);
  return user;
}

/**
 * Busca usuário por email.
 * @param {string} email
 * @returns {{id:number,email:string,password:string}|undefined}
 */
function findByEmail(email) {
  return users.find(u => u.email === email);
}

/**
 * Busca usuário por id.
 * @param {number} id
 * @returns {{id:number,email:string,password:string}|undefined}
 */
function findById(id) {
  return users.find(u => u.id === id);
}

/**
 * Reseta o armazenamento (útil para testes).
 */
function reset() {
  users = [];
  nextId = 1;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  reset,
};