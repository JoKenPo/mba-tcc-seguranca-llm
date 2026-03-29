import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * GET /profile
 * Returns the authenticated user's profile data.
 * Protected by the authenticate middleware.
 */
router.get("/profile", authenticate, (req, res) => {
  // req.user is set by the authenticate middleware
  const { id, name, email, createdAt } = req.user;

  return res.status(200).json({
    message: "Profile retrieved successfully",
    user: { id, name, email, createdAt },
  });
});

export default router;