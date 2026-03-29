import "./config/env.js"; // Must be first — validates env vars before anything else
import express from "express";
import { config } from "./config/env.js";
import { helmetMiddleware, generalRateLimiter } from "./middleware/security.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(generalRateLimiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
// Limit payload size to prevent large body attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/", authRoutes);
app.use("/", profileRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Don't leak error details in production
  const message =
    config.nodeEnv === "production" ? "Internal server error" : err.message;

  res.status(err.status || 500).json({ error: message });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;