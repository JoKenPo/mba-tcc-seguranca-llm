const userService = require("../services/userService");

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await userService.register(email, password);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const token = await userService.login(email, password);
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const getProfile = (req, res) => {
  res.json({ message: "User profile access granted", user: req.user });
};

module.exports = {
  register,
  login,
  getProfile,
};
