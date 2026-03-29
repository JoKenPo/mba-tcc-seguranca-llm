/**
 * Banco de dados em memória.
 * Simula uma camada de persistência usando um array JavaScript.
 * Os dados são perdidos ao reiniciar o servidor — adequado para fins didáticos.
 */

/** @type {Array<{id: string, email: string, password: string, createdAt: string}>} */
const users = [];

/**
 * Retorna todos os usuários cadastrados.
 * @returns {Array} Lista de usuários
 */
function findAllUsers() {
  return users;
}

/**
 * Busca um usuário pelo e-mail.
 * @param {string} email
 * @returns {object|undefined}
 */
function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

/**
 * Busca um usuário pelo ID.
 * @param {string} id
 * @returns {object|undefined}
 */
function findUserById(id) {
  return users.find((user) => user.id === id);
}

/**
 * Insere um novo usuário no array.
 * @param {object} user - Objeto com id, email, password e createdAt
 * @returns {object} Usuário inserido
 */
function insertUser(user) {
  users.push(user);
  return user;
}

module.exports = {
  findAllUsers,
  findUserByEmail,
  findUserById,
  insertUser,
};