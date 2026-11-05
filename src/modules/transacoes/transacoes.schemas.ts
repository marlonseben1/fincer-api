import { z } from 'zod';
import { TipoTransacao } from '../../generated/prisma/client.js';

const id = z.string().min(1);
const data = z.iso.date();
const valor = z.number().int().positive().max(2_000_000_000); // centavos
const tipoLancamento = z.enum(['RECEITA', 'DESPESA']);
const descricao = z.string().trim().max(200).nullable();
const fornecedor = z.string().trim().min(1).max(100).nullable();

/**
 * Lançamento mínimo: só "valor" é obrigatório.
 * - data: padrão hoje
 * - contaId: padrão a conta padrão do usuário
 * - categoriaId: omitido = usa a categoria aprendida do fornecedor;
 *   null = deixa sem categoria (a categorizar)
 * - tipo: vem da categoria; sem categoria, padrão DESPESA
 */
export const criarLancamentoSchema = z.object({
  tipo: tipoLancamento.optional(),
  data: data.optional(),
  valor,
  contaId: id.optional(),
  categoriaId: id.nullable().optional(),
  fornecedor: fornecedor.optional(),
  descricao: descricao.optional(),
});

export const criarTransferenciaSchema = z.object({
  data: data.optional(),
  valor,
  contaId: id.optional(), // origem; padrão a conta padrão
  contaDestinoId: id,
  descricao: descricao.optional(),
});

export const atualizarTransacaoSchema = z
  .object({
    tipo: tipoLancamento,
    data,
    valor,
    contaId: id,
    contaDestinoId: id,
    categoriaId: id.nullable(),
    fornecedor,
    descricao,
  })
  .partial();

export const listarTransacoesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
    sort: z.enum(['data', 'valor']).default('data'),
    order: z.enum(['asc', 'desc']).default('desc'),
    dataInicio: data.optional(),
    dataFim: data.optional(),
    tipo: z.enum(TipoTransacao).optional(),
    contaId: id.optional(), // origem ou destino
    categoriaId: id.optional(),
    fornecedorId: id.optional(),
    semCategoria: z.stringbool().default(false),
  })
  .refine((q) => !q.dataInicio || !q.dataFim || q.dataInicio <= q.dataFim, {
    message: 'dataInicio deve ser anterior a dataFim.',
    path: ['dataFim'],
  });

export type CriarLancamentoInput = z.infer<typeof criarLancamentoSchema>;
export type CriarTransferenciaInput = z.infer<typeof criarTransferenciaSchema>;
export type AtualizarTransacaoInput = z.infer<typeof atualizarTransacaoSchema>;
export type ListarTransacoesQuery = z.infer<typeof listarTransacoesQuerySchema>;
