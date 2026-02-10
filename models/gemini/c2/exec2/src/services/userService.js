const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = [];

const register = async (email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, email, password: hashedPassword };
  users.push(user);
  return user;
};

const findByEmail = (email) => {
  return users.find((u) => u.email === email);
};

const login = async (email, password) => {
  const user = findByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  return token;
};

module.exports = {
  register,
  findByEmail,
  login,
};
