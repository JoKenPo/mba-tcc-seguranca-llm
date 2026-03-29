// Armazena usuários em memória.
// Cada usuário tem: id, username, passwordHash
const users = [];

let nextId = 1;

/**
 * Busca um usuário pelo nome de usuário.
 * @param {string} username
 * @returns {object|undefined}
 */
function findByUsername(username) {
  return users.find(u => u.username === username);
}

/**
 * Busca um usuário pelo id.
 * @param {number} id
 * @returns {object|undefined}
 */
function findById(id) {
  return users.find(u => u.id === id);
}

/**
 * Cria e armazena um novo usuário.
 * @param {string} username
 * @param {string} passwordHash
 * @returns {object} usuário criado
 */
function createUser(username, passwordHash) {
  const user = {
    id: nextId++,
    username,
    passwordHash,
  };
  users.push(user);
  return user;
}

/**
 * Reseta o armazenamento (útil para testes).
 */
function reset() {
  users.length = 0;
  nextId = 1;
}

module.exports = {
  findByUsername,
  findById,
  createUser,
  reset,
};