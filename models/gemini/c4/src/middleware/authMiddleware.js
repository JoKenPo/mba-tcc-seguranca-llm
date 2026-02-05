const jwt = require("jsonwebtoken");
const config = require("../config/env");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // Bearer TOKEN
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ error: "Forbidden: Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
