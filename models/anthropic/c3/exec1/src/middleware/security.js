import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Sets basic security-related HTTP response headers manually,
 * covering the most critical ones without pulling in helmet.
 */
export function securityHeaders(req, res, next) {
  // Prevent browsers from MIME-sniffing the content type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Block the page from being embedded in iframes (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Enforce HTTPS for 1 year (only meaningful behind TLS in production)
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Restrict what information is sent in the Referer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Minimal Content Security Policy for a pure API (no HTML served)
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  // Remove Express's default "X-Powered-By" header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * General rate limiter applied to all routes.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Stricter rate limiter for authentication endpoints to slow down
 * brute-force and credential-stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.',
  },
});