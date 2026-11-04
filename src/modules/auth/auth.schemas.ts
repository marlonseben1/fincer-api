import { z } from 'zod';
import { criarContaSchema } from '../contas/contas.schemas.js';

export const loginSchema = z.object({
  token: z.string().min(1),
});

export const onboardingSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  contaPrincipal: criarContaSchema.omit({ padrao: true }),
  categoriasIniciais: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
