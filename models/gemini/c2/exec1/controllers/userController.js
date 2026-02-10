const userService = require("../services/userService");

const getProfile = async (req, res) => {
  try {
    const user = await userService.findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar perfil." });
  }
};

module.exports = {
  getProfile,
};
