const userService = require("../services/userService");

class UserController {
  async register(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email e senha são obrigatórios" });
      }

      const user = await userService.register(email, password);
      res.status(201).json({ message: "Usuário criado com sucesso", user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email e senha são obrigatórios" });
      }

      const token = await userService.login(email, password);
      res.status(200).json({ token });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      // O usuário já foi anexado ao req pelo middleware de autenticação
      const user = userService.getProfile(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
