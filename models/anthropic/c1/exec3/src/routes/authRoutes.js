const { Router } = require("express");
const { register, login, profile } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile); // rota protegida

module.exports = router;