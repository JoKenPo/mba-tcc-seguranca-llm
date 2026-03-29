import "dotenv/config";

// Validates and exports environment variables with safe defaults
const getEnvVar = (key, defaultValue = null, required = false) => {
  const value = process.env[key] ?? defaultValue;

  if (required && !value) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }

  return value;
};

export const config = {
  port: parseInt(getEnvVar("PORT", "3000"), 10),
  nodeEnv: getEnvVar("NODE_ENV", "development"),

  jwt: {
    // JWT_SECRET is required — app won't start without it
    secret: getEnvVar("JWT_SECRET", null, true),
    expiresIn: getEnvVar("JWT_EXPIRES_IN", "1h"),
  },

  bcrypt: {
    // saltRounds: higher = more secure but slower (10-12 is recommended)
    saltRounds: parseInt(getEnvVar("BCRYPT_SALT_ROUNDS", "12"), 10),
  },

  rateLimit: {
    windowMs: parseInt(getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 min
    max: parseInt(getEnvVar("RATE_LIMIT_MAX", "20"), 10),
  },
};