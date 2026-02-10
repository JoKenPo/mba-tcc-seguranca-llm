const userService = require("../services/userService");
const jwt = require("jsonwebtoken");
const { secretKey } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios." });
    }

    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email já cadastrado." });
    }

    const user = await userService.createUser(email, password);
    res
      .status(201)
      .json({ message: "Usuário criado com sucesso!", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios." });
    }

    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: "Senha inválida." });
    }

    const token = jwt.sign({ id: user.id }, secretKey, {
      expiresIn: 86400, // 24 horas
    });

    res.status(200).json({ auth: true, token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao realizar login." });
  }
};

module.exports = {
  register,
  login,
};
