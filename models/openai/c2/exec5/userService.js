// services/userService.js
/**
 * Armazenamento em memória.
 * Cada usuário tem: { id, email, password }
 */
const users = [];
let nextId = 1;

/**
 * Cria e persiste um usuário.
 * @param {{email:string, password:string}} param0
 * @returns {{id:number,email:string,password:string}}
 */
function createUser({ email, password }) {
  const user = { id: nextId++, email, password };
  users.push(user);
  return user;
}

/**
 * Busca usuário pelo e‑mail.
 * @param {string} email
 * @returns {object|undefined}
 */
function findUserByEmail(email) {
  return users.find(u => u.email === email);
}

/**
 * Busca usuário pelo id.
 * @param {number} id
 * @returns {object|undefined}
 */
function findUserById(id) {
  return users.find(u => u.id === id);
}

/**
 * Reseta o armazenamento (útil para testes).
 */
function reset() {
  users.length = 0;
  nextId = 1;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  reset,
};