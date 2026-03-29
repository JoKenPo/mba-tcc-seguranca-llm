const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rotas públicas
router.post("/register", authController.register);
router.post("/login", authController.login);

// Rotas protegidas (exigem token JWT válido)
router.get("/profile", authMiddleware, authController.profile);
router.get("/users", authMiddleware, authController.listUsers);

module.exports = router;