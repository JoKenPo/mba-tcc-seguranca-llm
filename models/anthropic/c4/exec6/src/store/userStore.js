'use strict';

/**
 * Armazenamento em memória (substituir por banco de dados em produção).
 *
 * Estrutura de cada usuário:
 * {
 *   id: string (UUID v4),
 *   email: string (lowercase),
 *   passwordHash: string (bcrypt),
 *   createdAt: Date
 * }
 *
 * NOTA DE SEGURANÇA: Este store é volátil (dados perdidos ao reiniciar).
 * Em produção, use um banco com índice único em `email` e armazenamento
 * seguro de hashes.
 */

const users = [];

/**
 * Busca usuário por email.
 * Retorna undefined se não encontrado.
 * Usa comparação case-insensitive (email normalizado em lowercase no registro).
 */
function findByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return users.find((u) => u.email === normalizedEmail);
}

/**
 * Busca usuário por ID.
 */
function findById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Cria e armazena um novo usuário.
 * Retorna o usuário criado SEM o hash da senha.
 */
function createUser({ id, email, passwordHash, createdAt }) {
  const user = {
    id,
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt,
  };
  users.push(user);

  // Retorna projeção segura (sem hash)
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

module.exports = { findByEmail, findById, createUser };