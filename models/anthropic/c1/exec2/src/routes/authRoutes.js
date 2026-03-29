const { Router } = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// ─── Rotas públicas ───────────────────────────────────────────────────────────
router.post("/register", authController.register);
router.post("/login", authController.login);

// ─── Rotas protegidas (requerem token JWT válido) ─────────────────────────────
router.get("/profile", authMiddleware, authController.getProfile);
router.get("/users", authMiddleware, authController.listUsers);

module.exports = router;