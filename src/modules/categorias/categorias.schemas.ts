import { z } from 'zod';
import { TipoCategoria } from '../../generated/prisma/client.js';

const nome = z.string().trim().min(1).max(30);
const icone = z.string().trim().min(1).max(50).nullable();

export const criarCategoriaSchema = z.object({
  nome,
  tipo: z.enum(TipoCategoria),
  icone: icone.optional(),
});

export const atualizarCategoriaSchema = z.object({ nome, icone }).partial();

export const listarCategoriasQuerySchema = z.object({
  tipo: z.enum(TipoCategoria).optional(),
  incluirArquivadas: z.stringbool().default(false),
});

export type CriarCategoriaInput = z.infer<typeof criarCategoriaSchema>;
export type AtualizarCategoriaInput = z.infer<typeof atualizarCategoriaSchema>;
export type ListarCategoriasQuery = z.infer<typeof listarCategoriasQuerySchema>;
