const bcrypt = require("bcryptjs");

// ─── "Banco de dados" em memória ──────────────────────────────────────────────
const users = [];
let nextId = 1;

// ─── Busca usuário pelo e-mail ─────────────────────────────────────────────────
const findByEmail = (email) => {
  return users.find((user) => user.email === email.toLowerCase().trim());
};

// ─── Busca usuário pelo ID ─────────────────────────────────────────────────────
const findById = (id) => {
  return users.find((user) => user.id === id);
};

// ─── Cria um novo usuário ──────────────────────────────────────────────────────
const createUser = async ({ name, email, password }) => {
  const SALT_ROUNDS = 10;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Retorna o usuário sem a senha
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// ─── Valida a senha do usuário ─────────────────────────────────────────────────
const validatePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// ─── Lista todos os usuários sem a senha ──────────────────────────────────────
const listUsers = () => {
  return users.map(({ password, ...user }) => user);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  validatePassword,
  listUsers,
};