// src/store/users.js
'use strict';

const crypto = require('crypto');

/**
 * Armazenamento em memória (substitua por um banco de dados em produção).
 *
 * AVISO: Todos os dados são perdidos ao reiniciar o servidor.
 * Em produção, use um banco de dados com conexão TLS e credenciais seguras.
 */
const users = [];

/**
 * Busca um usuário pelo e-mail usando comparação timing-safe.
 *
 * Por que timing-safe?
 * Comparações simples (===) podem vazar informações sobre o dado comparado
 * através do tempo de execução (timing attack). crypto.timingSafeEqual
 * garante tempo constante independentemente do conteúdo.
 *
 * @param {string} email - E-mail normalizado (minúsculas, sem espaços)
 * @returns {object|undefined} Usuário encontrado ou undefined
 */
function findUserByEmail(email) {
  const emailBuffer = Buffer.from(email);

  return users.find((user) => {
    const storedBuffer = Buffer.from(user.email);

    // timingSafeEqual exige buffers de mesmo tamanho.
    if (emailBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(emailBuffer, storedBuffer);
  });
}

/**
 * Busca um usuário pelo ID.
 * IDs são UUIDs v4 gerados internamente; não há risco de timing attack
 * relevante aqui, pois o ID vem de um JWT já validado.
 *
 * @param {string} id
 * @returns {object|undefined}
 */
function findUserById(id) {
  return users.find((user) => user.id === id);
}

/**
 * Cria e armazena um novo usuário.
 *
 * @param {object} userData
 * @param {string} userData.id
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.passwordHash
 * @returns {object} Usuário criado (sem o hash da senha)
 */
function createUser({ id, name, email, passwordHash }) {
  const user = {
    id,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Nunca retorne o hash da senha. Mesmo internamente, retornar apenas
  // o necessário reduz o risco de vazamento acidental em logs ou respostas.
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

module.exports = { findUserByEmail, findUserById, createUser };