const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("❌ Invalid environment variables:", env.error.format());
  process.exit(1);
}

module.exports = env.data;
