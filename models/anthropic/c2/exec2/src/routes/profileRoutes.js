/**
 * Profile Routes
 *
 * All routes here are protected by the `authenticate` middleware.
 *
 *   GET /profile  – retrieve the authenticated user's profile
 */

const { Router } = require("express");
const { getProfile } = require("../controllers/profileController");
const { authenticate } = require("../middleware/authMiddleware");

const router = Router();

// GET /profile  (protected)
router.get("/profile", authenticate, getProfile);

module.exports = router;