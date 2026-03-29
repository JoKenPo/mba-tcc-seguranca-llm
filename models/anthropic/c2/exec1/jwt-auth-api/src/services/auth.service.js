const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('crypto').webcrypto
  ? { v4: () => crypto.randomUUID() }
  : { v4: () => require('crypto').randomUUID() };

const db = require('../database/inMemoryDb');
const jwtConfig = require('../config/jwt.config');

// ── Constantes ───────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// ── Helpers de validação ─────────────────────────────────────────────────────

/**
 * Valida o formato do e-mail.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Valida o comprimento mínimo da senha.
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

// ── Serviços ─────────────────────────────────────────────────────────────────

/**
 * Registra um novo usuário.
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object }} Dados públicos do usuário criado
 * @throws {Error} Se os dados forem inválidos ou o e-mail já estiver em uso
 */
async function registerUser(email, password) {
  // Validações de entrada
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidEmail(email)) {
    const err = new Error('Invalid email format');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidPassword(password)) {
    const err = new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    );
    err.statusCode = 400;
    throw err;
  }

  // Verifica duplicidade
  const existingUser = db.findUserByEmail(email.toLowerCase());
  if (existingUser) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Cria o registro
  const newUser = {
    id: uuidv4(),
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  db.insertUser(newUser);

  // Retorna apenas dados públicos (sem a senha)
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
  };
}

/**
 * Autentica um usuário e retorna um token JWT.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 * @throws {Error} Se as credenciais forem inválidas
 */
async function loginUser(email, password) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  // Busca o usuário (case-insensitive)
  const user = db.findUserByEmail(email.toLowerCase());

  // Usa mensagem genérica para não revelar se o e-mail existe
  const invalidCredentialsError = new Error('Invalid email or password');
  invalidCredentialsError.statusCode = 401;

  if (!user) {
    throw invalidCredentialsError;
  }

  // Compara a senha com o hash armazenado
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw invalidCredentialsError;
  }

  // Gera o token JWT
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

/**
 * Retorna os dados públicos de um usuário pelo ID.
 * @param {string} userId
 * @returns {{ user: object }}
 * @throws {Error} Se o usuário não for encontrado
 */
function getUserProfile(userId) {
  const user = db.findUserById(userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};