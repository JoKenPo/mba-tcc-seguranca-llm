'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * Helmet: sets secure HTTP response headers.
 *
 * Protections applied:
 * - Content-Security-Policy
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Strict-Transport-Security (HSTS)
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,       // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * General rate limiter applied to all routes.
 * Prevents abuse and brute-force attacks.
 */
const generalRateLimit = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,    // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Limits login/register attempts to slow down brute-force attacks.
 */
const authRateLimit = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

module.exports = { helmetMiddleware, generalRateLimit, authRateLimit };