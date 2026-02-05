const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, authController.register); // Specific rate limit for auth
router.post("/login", authLimiter, authController.login); // Specific rate limit for auth
router.get("/profile", authenticateToken, authController.getProfile);

module.exports = router;
