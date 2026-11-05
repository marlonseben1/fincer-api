import { z } from 'zod';
import { mesAtual } from '../../lib/index.js';

const mes = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use o formato YYYY-MM.')
  .default(() => mesAtual());

export const resumoQuerySchema = z.object({ mes });

export const comparativoQuerySchema = z.object({
  ate: mes, // último mês da série
  meses: z.coerce.number().int().min(1).max(24).default(12),
});

export const categoriasQuerySchema = z.object({
  mes,
  tipo: z.enum(['RECEITA', 'DESPESA']).default('DESPESA'),
});

export type ResumoQuery = z.infer<typeof resumoQuerySchema>;
export type ComparativoQuery = z.infer<typeof comparativoQuerySchema>;
export type CategoriasQuery = z.infer<typeof categoriasQuerySchema>;
