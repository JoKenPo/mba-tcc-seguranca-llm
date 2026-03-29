import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * GET /profile
 * Protected route — requires a valid Bearer token.
 * Returns the authenticated user's profile data.
 */
router.get("/profile", authenticate, (req, res) => {
  return res.status(200).json({
    message: "Profile retrieved successfully.",
    user: req.user,
  });
});

export default router;