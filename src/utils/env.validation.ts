import { z } from 'zod';

const envSchema = z.object({
  BACKEND_DATABASE_URL: z
    .string()
    .default(
      'postgresql://postgres:postgres@localhost:5432/test?schema=public',
    ),
  PORT: z.string().default('3000'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().default(''),
  REFRESH_TOKEN_SECRET: z
    .string()
    .default('ABSDfaSFWDSFjwlDFJKLJAflkjadfkljakl'),
  ACCESS_TOKEN_SECRET: z
    .string()
    .default('ABSDfaSFWDSFjwlDFJKLJAflkjadfkljakl'),
  ACCESS_TOKEN_EXPIRE: z
    .string()
    .transform((e) => {
      return parseInt(e);
    })
    .default('6000'),
  REFRESH_TOKEN_EXPIRE: z
    .string()
    .transform((e) => {
      return parseInt(e);
    })
    .default('80000'),
});

export const env = envSchema.parse(process.env);
