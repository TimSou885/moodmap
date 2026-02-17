import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  MOOD_RATE_LIMIT_PER_HOUR: z.coerce.number().default(3),
  MOOD_EXPIRY_HOURS: z.coerce.number().default(24),
});

export type Config = z.infer<typeof envSchema>;

function loadConfig(): Config {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Safe diagnostic for Railway: do not log values
    const envKeys = Object.keys(process.env).filter((k) => k.includes('DATABASE') || k.includes('JWT'));
    console.error('Invalid environment:', parsed.error.flatten());
    console.error('Env diagnostic (keys only):', { relevantKeys: envKeys, hasDATABASE_URL: 'DATABASE_URL' in process.env, hasJWT_SECRET: 'JWT_SECRET' in process.env });
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const config = loadConfig();
