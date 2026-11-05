import { z } from 'zod';

export const listarFornecedoresQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
});

export type ListarFornecedoresQuery = z.infer<
  typeof listarFornecedoresQuerySchema
>;
