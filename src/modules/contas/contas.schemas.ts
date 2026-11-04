import { z } from 'zod';
import { TipoConta } from '../../generated/prisma/client.js';
import { isCodigoBanco } from '../bancos/bancos.helpers.js';

const codigoBanco = z
  .string()
  .refine(isCodigoBanco, 'Banco não suportado.')
  .nullable();

export const criarContaSchema = z.object({
  nome: z.string().trim().min(1).max(50),
  tipo: z.enum(TipoConta),
  banco: codigoBanco.optional(),
  saldoInicial: z.number().int().default(0), // centavos, pode ser negativo
  padrao: z.boolean().optional(),
});

export const atualizarContaSchema = z
  .object({
    nome: z.string().trim().min(1).max(50),
    tipo: z.enum(TipoConta),
    banco: codigoBanco,
    saldoInicial: z.number().int(),
    padrao: z.literal(true),
  })
  .partial();

export const listarContasQuerySchema = z.object({
  incluirArquivadas: z.stringbool().default(false),
});

export type CriarContaInput = z.infer<typeof criarContaSchema>;
export type AtualizarContaInput = z.infer<typeof atualizarContaSchema>;
export type ListarContasQuery = z.infer<typeof listarContasQuerySchema>;
