const { Router } = require("express");
const { register, login, me, listUsers } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// Rotas públicas
router.post("/auth/register", register);
router.post("/auth/login", login);

// Rotas protegidas — o authMiddleware valida o token antes de chamar o controller
router.get("/auth/me", authMiddleware, me);
router.get("/users", authMiddleware, listUsers);

module.exports = router;