const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = [];
const JWT_SECRET = "seu_segredo_super_secreto_123";

class UserService {
  async register(email, password) {
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      throw new Error("Usuário já existe");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
    };

    users.push(newUser);
    return { id: newUser.id, email: newUser.email };
  }

  async login(email, password) {
    const user = users.find((u) => u.email === email);
    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Credenciais inválidas");
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return token;
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Token inválido ou expirado");
    }
  }

  getProfile(userId) {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    return { id: user.id, email: user.email };
  }
}

module.exports = new UserService();
