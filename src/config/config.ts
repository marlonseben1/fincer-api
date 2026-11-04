import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3004),
  DATABASE_URL: z.url(),
  WEB_URL: z.url(),
});

export const env = schema.parse(process.env);
