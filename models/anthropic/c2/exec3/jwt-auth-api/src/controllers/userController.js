const { getUserById } = require("../services/userService");

/**
 * GET /profile
 *
 * Protected route — requires a valid Bearer token.
 * The `authenticate` middleware populates `req.user` with the decoded JWT payload.
 *
 * Returns the authenticated user's public profile.
 */
const getProfile = (req, res) => {
  // req.user is set by the authMiddleware after token verification
  const userId = req.user.sub;

  try {
    const user = getUserById(userId);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: { user },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { getProfile };