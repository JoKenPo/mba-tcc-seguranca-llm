import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

/**
 * Helmet sets secure HTTP headers:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Strict-Transport-Security (HSTS)
 * - Content-Security-Policy
 * - And more...
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  },
  // Disable X-Powered-By to avoid fingerprinting
  hidePoweredBy: true,
});

/**
 * General rate limiter for all routes.
 * Prevents abuse and brute-force at the API level.
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  message: {
    error: "Too many requests, please try again later",
  },
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Limits login/register attempts to slow down brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later",
  },
  // Skip successful requests — only count failures
  skipSuccessfulRequests: true,
});