// src/services/userService.js
let users = []; // Armazenamento em memória
let idCounter = 1;

/**
 * Cria um novo usuário.
 * @param {{email:string, password:string}} data
 * @returns {{id:number,email:string,password:string}}
 */
function createUser(data) {
  const newUser = {
    id: idCounter++,
    email: data.email,
    password: data.password,
  };
  users.push(newUser);
  return newUser;
}

/**
 * Busca usuário pelo e‑mail.
 * @param {string} email
 * @returns {object|undefined}
 */
function findByEmail(email) {
  return users.find((u) => u.email === email);
}

/**
 * Busca usuário pelo id.
 * @param {number} id
 * @returns {object|undefined}
 */
function findById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Reseta o armazenamento (útil para testes).
 */
function reset() {
  users = [];
  idCounter = 1;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  reset,
};