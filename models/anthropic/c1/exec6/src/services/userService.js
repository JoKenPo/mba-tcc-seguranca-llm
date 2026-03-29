const bcrypt = require("bcryptjs");

// Banco de dados em memória
const users = [];

/**
 * Busca um usuário pelo e-mail.
 * @param {string} email
 * @returns {object|undefined}
 */
const findByEmail = (email) => {
  return users.find((user) => user.email === email);
};

/**
 * Cria e salva um novo usuário no array.
 * @param {string} name
 * @param {string} email
 * @param {string} password - Senha em texto puro (será hasheada aqui)
 * @returns {object} Usuário criado (sem a senha)
 */
const createUser = async (name, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Retorna o usuário sem expor a senha
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

/**
 * Valida se a senha fornecida corresponde ao hash salvo.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {boolean}
 */
const validatePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Retorna todos os usuários sem expor as senhas.
 * @returns {Array}
 */
const getAllUsers = () => {
  return users.map(({ password, ...user }) => user);
};

module.exports = { findByEmail, createUser, validatePassword, getAllUsers };