// /home/your‑user/auth‑api/src/store/userStore.js

/**
 * Estrutura simples de armazenamento em memória.
 * Cada usuário tem: id, name, email, passwordHash
 */
class UserStore {
  constructor() {
    this.users = []; // Array de objetos
    this.lastId = 0;
  }

  create({ name, email, passwordHash }) {
    const id = ++this.lastId;
    const user = { id, name, email, passwordHash };
    this.users.push(user);
    return { id, name, email };
  }

  findByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  findById(id) {
    return this.users.find(u => u.id === id);
  }
}

// Exporta uma única instância (singleton)
module.exports = new UserStore();