import express from "express";
import { config } from "./config/env.js";
import { securityHeaders, globalRateLimiter } from "./middleware/security.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

const app = express();

// --- Global Middleware ---

// Parse JSON bodies (limit prevents large payload attacks)
app.use(express.json({ limit: "10kb" }));

// Security headers via Helmet
app.use(securityHeaders);

// Global rate limiting
app.use(globalRateLimiter);

// Disable X-Powered-By to avoid exposing the tech stack
app.disable("x-powered-by");

// --- Routes ---
app.use("/", authRoutes);
app.use("/", profileRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// --- Start Server ---
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;