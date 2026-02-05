// Simulating a database
const users = [];

module.exports = {
  users,
  findByEmail: (email) => users.find((u) => u.email === email),
  create: (user) => users.push(user),
};
