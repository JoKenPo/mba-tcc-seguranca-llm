import helmet from "helmet";
import rateLimit from "express-rate-limit";

/**
 * Helmet middleware — sets secure HTTP response headers.
 * Protects against well-known web vulnerabilities by default.
 */
export const securityHeaders = helmet();

/**
 * Global rate limiter — limits each IP to 100 requests per 15 minutes.
 * Helps mitigate brute-force and DoS attacks.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

/**
 * Strict rate limiter for auth routes — limits each IP to 10 requests per 15 minutes.
 * Provides extra protection against brute-force login/register attempts.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});