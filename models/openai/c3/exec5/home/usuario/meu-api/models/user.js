/**
 * Simula um "banco de dados" em memória.
 * Cada usuário tem: id, name, email, passwordHash
 */

const users = [];

/**
 * Busca usuário pelo e‑mail.
 * @param {string} email
 * @returns {object|undefined}
 */
function findByEmail(email) {
  return users.find(u => u.email === email);
}

/**
 * Busca usuário pelo id.
 * @param {string} id
 * @returns {object|undefined}
 */
function findById(id) {
  return users.find(u => u.id === id);
}

/**
 * Cria e persiste um novo usuário.
 * @param {object} payload { id, name, email, passwordHash }
 * @returns {object} usuário criado (sem a hash)
 */
function create({ id, name, email, passwordHash }) {
  const user = { id, name, email, passwordHash };
  users.push(user);
  // Retorna cópia sem a senha hash para não vazar
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Exporta apenas as funções necessárias.
 */
module.exports = {
  findByEmail,
  findById,
  create,
};