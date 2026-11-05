import { prisma } from '../../db/prisma.js';
import type { TipoTransacao } from '../../generated/prisma/client.js';
import { intervaloDoMes, paraData, somarMeses } from '../../lib/index.js';
import { saldoTotal } from '../contas/contas.service.js';
import type {
  CategoriasQuery,
  ComparativoQuery,
  ResumoQuery,
} from './dashboard.schemas.js';

// transferência só move dinheiro entre contas: nunca é receita nem despesa
const LANCAMENTOS: { in: TipoTransacao[] } = { in: ['RECEITA', 'DESPESA'] };

function filtroDoMes(mes: string) {
  const { inicio, fim } = intervaloDoMes(mes);
  return { gte: paraData(inicio), lt: paraData(fim) };
}

export async function resumo(usuarioId: string, query: ResumoQuery) {
  const [patrimonio, totais, caixaDeEntrada] = await Promise.all([
    saldoTotal(usuarioId),
    prisma.transacao.groupBy({
      by: ['tipo'],
      where: { usuarioId, tipo: LANCAMENTOS, data: filtroDoMes(query.mes) },
      _sum: { valor: true },
    }),
    prisma.transacao.count({
      where: { usuarioId, categoriaId: null, tipo: LANCAMENTOS },
    }),
  ]);

  const total = (tipo: string) =>
    totais.find((grupo) => grupo.tipo === tipo)?._sum.valor ?? 0;

  const receitas = total('RECEITA');
  const despesas = total('DESPESA');

  return {
    mes: query.mes,
    patrimonio,
    receitas,
    despesas,
    balanco: receitas - despesas,
    caixaDeEntrada,
  };
}

export async function comparativo(usuarioId: string, query: ComparativoQuery) {
  const primeiroMes = somarMeses(query.ate, -(query.meses - 1));
  const { inicio } = intervaloDoMes(primeiroMes);
  const { fim } = intervaloDoMes(query.ate);

  // o Prisma não agrupa por mês, então aqui vai SQL (parametrizado)
  const linhas = await prisma.$queryRaw<
    Array<{ mes: string; tipo: string; total: bigint }>
  >`
    SELECT to_char(data, 'YYYY-MM') AS mes, tipo::text AS tipo, SUM(valor)::bigint AS total
    FROM transacoes
    WHERE usuario_id = ${usuarioId}
      AND tipo IN ('RECEITA', 'DESPESA')
      AND data >= ${inicio}::date
      AND data < ${fim}::date
    GROUP BY 1, 2
  `;

  // meses sem movimento entram zerados, para o gráfico não "pular" meses
  return Array.from({ length: query.meses }, (_, indice) => {
    const mes = somarMeses(primeiroMes, indice);
    const total = (tipo: string) =>
      Number(
        linhas.find((linha) => linha.mes === mes && linha.tipo === tipo)
          ?.total ?? 0,
      );

    return { mes, receitas: total('RECEITA'), despesas: total('DESPESA') };
  });
}

export async function porCategoria(usuarioId: string, query: CategoriasQuery) {
  const grupos = await prisma.transacao.groupBy({
    by: ['categoriaId'],
    where: { usuarioId, tipo: query.tipo, data: filtroDoMes(query.mes) },
    _sum: { valor: true },
  });

  const ids = grupos
    .map((grupo) => grupo.categoriaId)
    .filter((id): id is string => id !== null);

  // inclui arquivadas: o histórico continua mostrando onde o dinheiro foi
  const categorias = await prisma.categoria.findMany({
    where: { id: { in: ids }, usuarioId },
    select: { id: true, nome: true, icone: true },
  });

  const itens = grupos
    .map((grupo) => ({
      categoria:
        categorias.find((categoria) => categoria.id === grupo.categoriaId) ??
        null, // null = sem categoria (caixa de entrada)
      total: grupo._sum.valor ?? 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    mes: query.mes,
    tipo: query.tipo,
    total: itens.reduce((soma, item) => soma + item.total, 0),
    itens,
  };
}
