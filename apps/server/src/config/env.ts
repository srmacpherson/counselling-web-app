import { fileURLToPath } from 'node:url';

import * as dotenv from 'dotenv';
import { z } from 'zod';

const envPath = fileURLToPath(new URL('../../../../.env', import.meta.url));
dotenv.config({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(32).default('development-session-secret-change-me-please'),
  JWT_SECRET: z.string().min(32).default('development-jwt-secret-change-me-please'),
  COOKIE_NAME: z.string().default('counselling_admin_session'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
