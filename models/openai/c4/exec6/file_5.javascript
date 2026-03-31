// /home/user/api/models/userStore.js
/**
 * Simples repositório em memória.
 * Cada usuário tem: id, name, email, passwordHash
 */
class UserStore {
  constructor() {
    this.users = []; // array de objetos
    this.lastId = 0;
  }

  create(user) {
    const id = ++this.lastId;
    const newUser = { id, ...user };
    this.users.push(newUser);
    return newUser;
  }

  findByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  findById(id) {
    return this.users.find(u => u.id === id);
  }
}

module.exports = new UserStore();