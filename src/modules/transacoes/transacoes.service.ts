import { prisma } from '../../db/prisma.js';
import type { Categoria, Prisma } from '../../generated/prisma/client.js';
import {
  ConflictError,
  formatarData,
  hoje,
  NotFoundError,
  paraData,
  UnauthorizedError,
  ValidationError,
} from '../../lib/index.js';
import {
  aprenderCategoria,
  obterOuCriarFornecedor,
} from '../fornecedores/fornecedores.service.js';
import type {
  AtualizarTransacaoInput,
  CriarLancamentoInput,
  CriarTransferenciaInput,
  ListarTransacoesQuery,
} from './transacoes.schemas.js';

type Tx = Prisma.TransactionClient;
type TipoLancamento = 'RECEITA' | 'DESPESA';

const incluirRelacoes = {
  conta: { select: { id: true, nome: true, arquivadaEm: true } },
  contaDestino: { select: { id: true, nome: true, arquivadaEm: true } },
  categoria: true,
  fornecedor: { select: { id: true, nome: true } },
} satisfies Prisma.TransacaoInclude;

type TransacaoCompleta = Prisma.TransacaoGetPayload<{
  include: typeof incluirRelacoes;
}>;

function serializarTransacao(transacao: TransacaoCompleta) {
  const { conta, contaDestino, categoria, fornecedor } = transacao;

  return {
    id: transacao.id,
    tipo: transacao.tipo,
    valor: transacao.valor,
    data: formatarData(transacao.data),
    descricao: transacao.descricao,
    conta: { id: conta.id, nome: conta.nome },
    contaDestino: contaDestino
      ? { id: contaDestino.id, nome: contaDestino.nome }
      : null,
    categoria: categoria
      ? {
          id: categoria.id,
          nome: categoria.nome,
          icone: categoria.icone,
          tipo: categoria.tipo,
        }
      : null,
    fornecedor,
    createdAt: transacao.createdAt.toISOString(),
  };
}

async function resolverConta(tx: Tx, usuarioId: string, contaId?: string) {
  let id = contaId;

  if (!id) {
    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { contaPadraoId: true },
    });

    if (!usuario) throw new UnauthorizedError();
    if (!usuario.contaPadraoId) {
      throw new ValidationError(
        'Informe a conta: não há uma conta padrão definida.',
      );
    }

    id = usuario.contaPadraoId;
  }

  const conta = await tx.conta.findFirst({ where: { id, usuarioId } });

  if (!conta) throw new NotFoundError('Conta não encontrada.');
  if (conta.arquivadaEm) {
    throw new ConflictError('Conta arquivada não recebe lançamentos.');
  }

  return conta;
}

async function resolverCategoria(
  tx: Tx,
  usuarioId: string,
  categoriaId: string,
) {
  const categoria = await tx.categoria.findFirst({
    where: { id: categoriaId, usuarioId },
  });

  if (!categoria) throw new NotFoundError('Categoria não encontrada.');
  if (categoria.arquivadaEm) {
    throw new ConflictError('Categoria arquivada não pode ser usada.');
  }

  return categoria;
}

/** A categoria manda no tipo; sem categoria, vale o tipo informado ou DESPESA. */
function resolverTipo(
  tipoInformado: TipoLancamento | undefined,
  categoria: Categoria | null,
): TipoLancamento {
  if (categoria && tipoInformado && categoria.tipo !== tipoInformado) {
    throw new ValidationError(
      'O tipo informado não corresponde ao tipo da categoria.',
    );
  }

  return categoria?.tipo ?? tipoInformado ?? 'DESPESA';
}

async function buscarTransacaoDoUsuario(
  client: Tx,
  usuarioId: string,
  id: string,
) {
  const transacao = await client.transacao.findFirst({
    where: { id, usuarioId },
    include: incluirRelacoes,
  });

  if (!transacao) throw new NotFoundError('Transação não encontrada.');

  return transacao;
}

/** Mexer em transação de conta arquivada mudaria o saldo de uma conta "fechada". */
function garantirContasAtivas(transacao: TransacaoCompleta) {
  if (transacao.conta.arquivadaEm || transacao.contaDestino?.arquivadaEm) {
    throw new ConflictError(
      'Transação de conta arquivada não pode ser alterada.',
    );
  }
}

export async function listarTransacoes(
  usuarioId: string,
  query: ListarTransacoesQuery,
) {
  const filtros: Prisma.TransacaoWhereInput[] = [];

  if (query.tipo) filtros.push({ tipo: query.tipo });
  if (query.categoriaId) filtros.push({ categoriaId: query.categoriaId });
  if (query.fornecedorId) filtros.push({ fornecedorId: query.fornecedorId });
  if (query.contaId) {
    filtros.push({
      OR: [{ contaId: query.contaId }, { contaDestinoId: query.contaId }],
    });
  }
  if (query.semCategoria) {
    filtros.push({ categoriaId: null, tipo: { not: 'TRANSFERENCIA' } });
  }
  if (query.dataInicio) {
    filtros.push({ data: { gte: paraData(query.dataInicio) } });
  }
  if (query.dataFim) filtros.push({ data: { lte: paraData(query.dataFim) } });

  const where: Prisma.TransacaoWhereInput = { usuarioId, AND: filtros };

  const [total, transacoes] = await Promise.all([
    prisma.transacao.count({ where }),
    prisma.transacao.findMany({
      where,
      include: incluirRelacoes,
      orderBy: [
        query.sort === 'valor' ? { valor: query.order } : { data: query.order },
        { createdAt: 'desc' },
      ],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: transacoes.map(serializarTransacao),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function buscarTransacao(usuarioId: string, id: string) {
  return serializarTransacao(
    await buscarTransacaoDoUsuario(prisma, usuarioId, id),
  );
}

export async function criarLancamento(
  usuarioId: string,
  input: CriarLancamentoInput,
) {
  const id = await prisma.$transaction(async (tx) => {
    const conta = await resolverConta(tx, usuarioId, input.contaId);

    const fornecedor = input.fornecedor
      ? await obterOuCriarFornecedor(tx, usuarioId, input.fornecedor)
      : null;

    let categoria: Categoria | null = null;

    if (input.categoriaId) {
      categoria = await resolverCategoria(tx, usuarioId, input.categoriaId);
    } else if (
      input.categoriaId === undefined &&
      fornecedor?.categoriaPadraoId
    ) {
      // sugestão pela categoria aprendida; ignorada se arquivada
      // ou se contradiz o tipo informado
      const sugerida = await tx.categoria.findFirst({
        where: {
          id: fornecedor.categoriaPadraoId,
          usuarioId,
          arquivadaEm: null,
        },
      });

      if (sugerida && (!input.tipo || sugerida.tipo === input.tipo)) {
        categoria = sugerida;
      }
    }

    const transacao = await tx.transacao.create({
      data: {
        usuarioId,
        tipo: resolverTipo(input.tipo, categoria),
        valor: input.valor,
        data: paraData(input.data ?? hoje()),
        descricao: input.descricao ?? null,
        contaId: conta.id,
        categoriaId: categoria?.id ?? null,
        fornecedorId: fornecedor?.id ?? null,
      },
    });

    if (fornecedor && input.categoriaId) {
      await aprenderCategoria(tx, fornecedor.id, input.categoriaId);
    }

    return transacao.id;
  });

  return buscarTransacao(usuarioId, id);
}

export async function criarTransferencia(
  usuarioId: string,
  input: CriarTransferenciaInput,
) {
  const id = await prisma.$transaction(async (tx) => {
    const origem = await resolverConta(tx, usuarioId, input.contaId);
    const destino = await resolverConta(tx, usuarioId, input.contaDestinoId);

    if (origem.id === destino.id) {
      throw new ValidationError(
        'A conta de destino deve ser diferente da conta de origem.',
      );
    }

    const transacao = await tx.transacao.create({
      data: {
        usuarioId,
        tipo: 'TRANSFERENCIA',
        valor: input.valor,
        data: paraData(input.data ?? hoje()),
        descricao: input.descricao ?? null,
        contaId: origem.id,
        contaDestinoId: destino.id,
      },
    });

    return transacao.id;
  });

  return buscarTransacao(usuarioId, id);
}

export async function atualizarTransacao(
  usuarioId: string,
  id: string,
  input: AtualizarTransacaoInput,
) {
  await prisma.$transaction(async (tx) => {
    const atual = await buscarTransacaoDoUsuario(tx, usuarioId, id);
    garantirContasAtivas(atual);

    const camposComuns = {
      valor: input.valor,
      data: input.data ? paraData(input.data) : undefined,
      descricao: input.descricao,
    };

    if (atual.tipo === 'TRANSFERENCIA') {
      if (
        input.tipo ||
        input.categoriaId !== undefined ||
        input.fornecedor !== undefined
      ) {
        throw new ValidationError(
          'Transferência não tem tipo, categoria nem fornecedor.',
        );
      }

      const contaId = input.contaId
        ? (await resolverConta(tx, usuarioId, input.contaId)).id
        : atual.contaId;
      const contaDestinoId = input.contaDestinoId
        ? (await resolverConta(tx, usuarioId, input.contaDestinoId)).id
        : atual.contaDestinoId;

      if (contaId === contaDestinoId) {
        throw new ValidationError(
          'A conta de destino deve ser diferente da conta de origem.',
        );
      }

      await tx.transacao.update({
        where: { id },
        data: { ...camposComuns, contaId, contaDestinoId },
      });
      return;
    }

    if (input.contaDestinoId) {
      throw new ValidationError('Só transferências têm conta de destino.');
    }

    const contaId = input.contaId
      ? (await resolverConta(tx, usuarioId, input.contaId)).id
      : undefined;

    let fornecedorId: string | null | undefined;
    if (input.fornecedor === null) fornecedorId = null;
    else if (input.fornecedor) {
      fornecedorId = (
        await obterOuCriarFornecedor(tx, usuarioId, input.fornecedor)
      ).id;
    }

    // undefined = mantém a categoria atual
    let categoria: Categoria | null = atual.categoria;
    if (input.categoriaId === null) categoria = null;
    else if (input.categoriaId) {
      categoria = await resolverCategoria(tx, usuarioId, input.categoriaId);
    }

    // sem categoria e sem tipo informado, mantém o tipo atual
    const tipoInformado =
      input.tipo ?? (categoria ? undefined : (atual.tipo as TipoLancamento));

    await tx.transacao.update({
      where: { id },
      data: {
        ...camposComuns,
        tipo: resolverTipo(tipoInformado, categoria),
        contaId,
        categoriaId: categoria?.id ?? null,
        fornecedorId,
      },
    });

    // categorizar pela caixa de entrada também ensina o fornecedor
    const fornecedorFinal =
      fornecedorId === undefined ? atual.fornecedorId : fornecedorId;
    if (fornecedorFinal && input.categoriaId) {
      await aprenderCategoria(tx, fornecedorFinal, input.categoriaId);
    }
  });

  return buscarTransacao(usuarioId, id);
}

export async function excluirTransacao(usuarioId: string, id: string) {
  const transacao = await buscarTransacaoDoUsuario(prisma, usuarioId, id);
  garantirContasAtivas(transacao);

  await prisma.transacao.delete({ where: { id } });
}
