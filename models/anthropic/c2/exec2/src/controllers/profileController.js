/**
 * Profile Controller
 *
 * Handles HTTP concerns for the profile endpoint:
 *   GET /profile
 *
 * This route is protected by the `authenticate` middleware, so
 * `req.user` is guaranteed to contain the decoded JWT payload
 * when any handler here is invoked.
 */

const userService = require("../services/userService");

// ---------------------------------------------------------------------------
// GET /profile
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user's profile.
 *
 * The user ID is extracted from the JWT payload (`req.user.sub`),
 * which was attached by the `authenticate` middleware.
 *
 * Responses:
 *   200 – Profile returned successfully.
 *   404 – User not found (e.g. deleted after token was issued).
 *   500 – Unexpected server error.
 */
async function getProfile(req, res) {
  try {
    // `req.user.sub` holds the user ID (set during token generation)
    const userId = req.user.sub;

    const profile = userService.getProfile(userId);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: { user: profile },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
}

module.exports = { getProfile };