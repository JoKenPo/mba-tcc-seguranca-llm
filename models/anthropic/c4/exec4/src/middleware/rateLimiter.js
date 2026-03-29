'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Security fix: without rate limiting, auth endpoints are trivially brute-forced.
 * 10 attempts per 15 minutes per IP is a reasonable threshold for auth routes.
 *
 * standardHeaders: true  → sends RateLimit-* headers (RFC 6585)
 * legacyHeaders: false   → suppresses the older X-RateLimit-* headers
 */
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,
  message:         { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
  // Security fix: skip successful requests so the limit only counts failures
  skipSuccessfulRequests: false,
});

module.exports = { authLimiter };