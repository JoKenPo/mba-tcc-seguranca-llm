'use strict';

// Armazenamento em memória — substituir por banco de dados em produção real.
const users = [];

function findByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

function findById(id) {
  return users.find((u) => u.id === id) || null;
}

function create(user) {
  users.push(user);
  return user;
}

module.exports = { findByEmail, findById, create };