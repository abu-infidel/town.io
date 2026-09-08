import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  PUBLIC_DOMAIN: z.string().default("localhost"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be set to a long random string"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  SMS_PROVIDER: z.enum(["console", "kavenegar"]).default("console"),
  KAVENEGAR_API_KEY: z.string().optional(),
  KAVENEGAR_TEMPLATE: z.string().optional(),

  MODERATION_PROVIDER: z.enum(["none", "claude"]).default("none"),
  ANTHROPIC_API_KEY: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(["manual", "zarinpal"]).default("manual"),
  MANUAL_PAYMENT_CARD_NUMBER: z.string().optional(),
  MANUAL_PAYMENT_SHEBA: z.string().optional(),
  MANUAL_PAYMENT_OWNER_NAME: z.string().optional(),

  MEDIA_UPLOAD_DIR: z.string().default("./media/uploads"),
  MEDIA_PROCESSED_DIR: z.string().default("./media/processed"),
  MEDIA_MAX_IMAGE_MB: z.coerce.number().default(15),
  MEDIA_MAX_VIDEO_MB: z.coerce.number().default(200),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loud - a misconfigured env is the #1 cause of a "simple to
  // self-host" app becoming a support burden.
  console.error("Invalid environment configuration:\n", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
