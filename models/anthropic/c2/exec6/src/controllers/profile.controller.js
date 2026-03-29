const authService = require('../services/auth.service');

const profileController = {
  /**
   * GET /profile
   *
   * Returns the authenticated user's profile data.
   * Requires a valid Bearer token in the Authorization header.
   *
   * The user ID is extracted from the JWT payload attached
   * to `req.user` by the auth middleware.
   *
   * Responses:
   *   200 – Profile data returned
   *   401 – Missing or invalid token
   *   404 – User not found
   */
  getProfile(req, res, next) {
    try {
      // req.user is set by authMiddleware after token verification
      const userId = req.user.sub;

      const user = authService.getProfile(userId);

      return res.status(200).json({
        message: 'Profile retrieved successfully',
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = profileController;