import { prisma } from '../../db/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { ListarFornecedoresQuery } from './fornecedores.schemas.js';

type Tx = Prisma.TransactionClient;

const LIMITE_AUTOCOMPLETE = 10;

/**
 * Busca o fornecedor pelo nome, sem distinção de maiúsculas, ou cria um novo.
 * Não existe tela de cadastro de fornecedor: eles nascem dos lançamentos.
 */
export async function obterOuCriarFornecedor(
  tx: Tx,
  usuarioId: string,
  nome: string,
) {
  const existente = await tx.fornecedor.findFirst({
    where: { usuarioId, nome: { equals: nome, mode: 'insensitive' } },
  });

  return existente ?? tx.fornecedor.create({ data: { usuarioId, nome } });
}

/** Guarda a última categoria usada com o fornecedor, para sugerir na próxima. */
export async function aprenderCategoria(
  tx: Tx,
  fornecedorId: string,
  categoriaId: string,
) {
  await tx.fornecedor.update({
    where: { id: fornecedorId },
    data: { categoriaPadraoId: categoriaId },
  });
}

export async function listarFornecedores(
  usuarioId: string,
  query: ListarFornecedoresQuery,
) {
  const fornecedores = await prisma.fornecedor.findMany({
    where: {
      usuarioId,
      ...(query.q ? { nome: { contains: query.q, mode: 'insensitive' } } : {}),
    },
    include: {
      categoriaPadrao: {
        select: {
          id: true,
          nome: true,
          icone: true,
          tipo: true,
          arquivadaEm: true,
        },
      },
    },
    orderBy: { nome: 'asc' },
    take: LIMITE_AUTOCOMPLETE,
  });

  return fornecedores.map((fornecedor) => {
    const categoria = fornecedor.categoriaPadrao;

    return {
      id: fornecedor.id,
      nome: fornecedor.nome,
      // categoria arquivada não é mais sugerida
      categoriaPadrao:
        categoria && !categoria.arquivadaEm
          ? {
              id: categoria.id,
              nome: categoria.nome,
              icone: categoria.icone,
              tipo: categoria.tipo,
            }
          : null,
    };
  });
}
