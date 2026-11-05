import { prisma } from '../../db/prisma.js';
import type { Conta } from '../../generated/prisma/client.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/index.js';
import { BANCOS } from '../bancos/bancos.constants.js';
import { isCodigoBanco } from '../bancos/bancos.helpers.js';
import type {
  AtualizarContaInput,
  CriarContaInput,
  ListarContasQuery,
} from './contas.schemas.js';

/**
 * Saldo = saldo inicial + receitas − despesas − transferências enviadas
 * + transferências recebidas. Calculado sempre a partir das transações,
 * nunca armazenado, para não desalinhar.
 */
async function calcularSaldos(contas: Conta[]): Promise<Map<string, number>> {
  const saldos = new Map(contas.map((conta) => [conta.id, conta.saldoInicial]));
  const ids = contas.map((conta) => conta.id);

  if (ids.length === 0) return saldos;

  const [porOrigem, porDestino] = await Promise.all([
    prisma.transacao.groupBy({
      by: ['contaId', 'tipo'],
      where: { contaId: { in: ids } },
      _sum: { valor: true },
    }),
    prisma.transacao.groupBy({
      by: ['contaDestinoId'],
      where: { contaDestinoId: { in: ids }, tipo: 'TRANSFERENCIA' },
      _sum: { valor: true },
    }),
  ]);

  for (const grupo of porOrigem) {
    const valor = grupo._sum.valor ?? 0;
    const efeito = grupo.tipo === 'RECEITA' ? valor : -valor; // despesa e transferência saem
    saldos.set(grupo.contaId, (saldos.get(grupo.contaId) ?? 0) + efeito);
  }

  for (const grupo of porDestino) {
    if (!grupo.contaDestinoId) continue;
    saldos.set(
      grupo.contaDestinoId,
      (saldos.get(grupo.contaDestinoId) ?? 0) + (grupo._sum.valor ?? 0),
    );
  }

  return saldos;
}

/** Soma dos saldos das contas ativas (cartão de crédito entra negativo). */
export async function saldoTotal(usuarioId: string) {
  const contas = await prisma.conta.findMany({
    where: { usuarioId, arquivadaEm: null },
  });
  const saldos = await calcularSaldos(contas);

  let patrimonio = 0;
  for (const saldo of saldos.values()) patrimonio += saldo;

  return patrimonio;
}

function serializarConta(
  conta: Conta,
  saldo: number,
  contaPadraoId: string | null,
) {
  return {
    id: conta.id,
    nome: conta.nome,
    tipo: conta.tipo,
    banco:
      conta.banco && isCodigoBanco(conta.banco)
        ? { codigo: conta.banco, nome: BANCOS[conta.banco] }
        : null,
    saldoInicial: conta.saldoInicial,
    saldo,
    padrao: conta.id === contaPadraoId,
    arquivadaEm: conta.arquivadaEm?.toISOString() ?? null,
  };
}

async function buscarContaPadraoId(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { contaPadraoId: true },
  });

  // token válido, mas o usuário não existe mais (ex.: banco resetado)
  if (!usuario) {
    throw new UnauthorizedError();
  }

  return usuario.contaPadraoId;
}

async function buscarContaDoUsuario(usuarioId: string, id: string) {
  const conta = await prisma.conta.findFirst({ where: { id, usuarioId } });

  if (!conta) {
    throw new NotFoundError('Conta não encontrada.');
  }

  return conta;
}

export async function listarContas(
  usuarioId: string,
  query: ListarContasQuery,
) {
  const [contas, contaPadraoId] = await Promise.all([
    prisma.conta.findMany({
      where: {
        usuarioId,
        ...(query.incluirArquivadas ? {} : { arquivadaEm: null }),
      },
      orderBy: [
        { arquivadaEm: { sort: 'desc', nulls: 'first' } },
        { nome: 'asc' },
      ],
    }),
    buscarContaPadraoId(usuarioId),
  ]);

  const saldos = await calcularSaldos(contas);

  return contas.map((conta) =>
    serializarConta(conta, saldos.get(conta.id) ?? 0, contaPadraoId),
  );
}

export async function buscarConta(usuarioId: string, id: string) {
  const [conta, contaPadraoId] = await Promise.all([
    buscarContaDoUsuario(usuarioId, id),
    buscarContaPadraoId(usuarioId),
  ]);

  const saldos = await calcularSaldos([conta]);

  return serializarConta(conta, saldos.get(conta.id) ?? 0, contaPadraoId);
}

export async function criarConta(usuarioId: string, input: CriarContaInput) {
  const { padrao, ...dados } = input;

  const contaId = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { contaPadraoId: true },
    });

    if (!usuario) {
      throw new UnauthorizedError();
    }

    const conta = await tx.conta.create({ data: { ...dados, usuarioId } });

    // a primeira conta vira a padrão automaticamente
    if (padrao || !usuario.contaPadraoId) {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { contaPadraoId: conta.id },
      });
    }

    return conta.id;
  });

  return buscarConta(usuarioId, contaId);
}

export async function atualizarConta(
  usuarioId: string,
  id: string,
  input: AtualizarContaInput,
) {
  const conta = await buscarContaDoUsuario(usuarioId, id);

  if (conta.arquivadaEm) {
    throw new ConflictError('Conta arquivada não pode ser alterada.');
  }

  const { padrao, ...dados } = input;

  await prisma.$transaction(async (tx) => {
    await tx.conta.update({ where: { id }, data: dados });

    if (padrao) {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { contaPadraoId: id },
      });
    }
  });

  return buscarConta(usuarioId, id);
}

export async function arquivarConta(usuarioId: string, id: string) {
  const [conta, contaPadraoId] = await Promise.all([
    buscarContaDoUsuario(usuarioId, id),
    buscarContaPadraoId(usuarioId),
  ]);

  if (conta.arquivadaEm) {
    throw new ConflictError('Conta já está arquivada.');
  }

  if (conta.id === contaPadraoId) {
    throw new ConflictError(
      'Defina outra conta como padrão antes de arquivar esta.',
    );
  }

  const saldos = await calcularSaldos([conta]);

  if (saldos.get(conta.id) !== 0) {
    throw new ConflictError(
      'Zere o saldo da conta (ex.: transferindo para outra) antes de arquivar.',
    );
  }

  await prisma.conta.update({
    where: { id },
    data: { arquivadaEm: new Date() },
  });
}
