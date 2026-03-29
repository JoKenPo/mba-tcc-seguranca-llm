import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Helmet configuration for secure HTTP headers.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,       // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'no-referrer' },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
});

/**
 * General rate limiter applied to all routes.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,     // Disable X-RateLimit-* headers
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the request limit. Please try again later.',
  },
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Limits to 10 attempts per 15 minutes to prevent brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});