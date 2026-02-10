const db = require("./db");
const bcrypt = require("bcryptjs");

const createUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
    db.run(sql, [email, hashedPassword], function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ id: this.lastID, email });
    });
  });
};

const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
};

const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, email FROM users WHERE id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
