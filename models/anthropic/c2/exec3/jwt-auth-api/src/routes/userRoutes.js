const { Router } = require("express");
const { getProfile } = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

const router = Router();

/**
 * @route  GET /profile
 * @desc   Retrieve the authenticated user's profile
 * @access Private (JWT required)
 */
router.get("/profile", authenticate, getProfile);

module.exports = router;