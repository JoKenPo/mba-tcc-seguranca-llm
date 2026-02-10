const authService = require("../services/authService");

class AuthController {
  async register(req, res) {
    try {
      const { email, username, password } = req.body;
      const identifier = email || username;
      if (!identifier || !password) {
        return res
          .status(400)
          .json({ message: "Email/Username and password are required" });
      }
      const user = await authService.register(identifier, password);
      res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, username, password } = req.body;
      const identifier = email || username;
      const token = await authService.login(identifier, password);
      res.json({ token });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  async profile(req, res) {
    // The user is already attached to req by the middleware
    const user = authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  }
}

module.exports = new AuthController();
