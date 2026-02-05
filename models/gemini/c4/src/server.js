const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const config = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// Security Middleware
app.use(helmet()); // Sets various HTTP headers for security
app.use(
  cors({
    origin: config.NODE_ENV === "production" ? "https://your-domain.com" : "*", // Restrict in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10kb" })); // Limit body size to prevent DoS

// Rate Limiting (Global)
app.use(apiLimiter);

// Routes
app.use("/", authRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" }); // Don't leak stack traces
});

// Start Server
if (require.main === module) {
  app.listen(config.PORT, () => {
    console.log(`Server running securely on port ${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
  });
}

module.exports = app;
