const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getMe, listUsers } = require("../controllers/userController");

const router = Router();

// All routes in this file require a valid JWT
router.use(authMiddleware);

router.get("/me", getMe);
router.get("/", listUsers);

module.exports = router;