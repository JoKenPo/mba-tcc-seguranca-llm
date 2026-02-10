const jwt = require("jsonwebtoken");

// In-memory persistence
const users = [];
const JWT_SECRET = "your-secret-key"; // In a real app, use environment variables

class AuthService {
  async register(identifier, password) {
    if (users.find((u) => u.email === identifier)) {
      throw new Error("User already exists");
    }
    const newUser = { id: users.length + 1, email: identifier, password };
    users.push(newUser);
    return { id: newUser.id, email: newUser.email };
  }

  async login(identifier, password) {
    const user = users.find(
      (u) => u.email === identifier && u.password === password,
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });
    return token;
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  getUserById(id) {
    return users.find((u) => u.id === id);
  }
}

module.exports = new AuthService();
