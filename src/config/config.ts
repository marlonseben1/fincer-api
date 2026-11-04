import { z } from 'zod';

const emailList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(z.email())
      .min(1, 'Informe ao menos um e-mail com permissão de login.'),
  );

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3004),
  DATABASE_URL: z.url(),
  WEB_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ALLOWED_LOGIN_EMAILS: emailList,
});

export const env = schema.parse(process.env);
