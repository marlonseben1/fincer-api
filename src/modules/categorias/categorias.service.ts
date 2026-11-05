import { prisma } from '../../db/prisma.js';
import type {
  Categoria,
  TipoCategoria,
} from '../../generated/prisma/client.js';
import {
  ConflictError,
  isUniqueViolation,
  NotFoundError,
} from '../../lib/index.js';
import type {
  AtualizarCategoriaInput,
  CriarCategoriaInput,
  ListarCategoriasQuery,
} from './categorias.schemas.js';

function serializarCategoria(categoria: Categoria) {
  return {
    id: categoria.id,
    nome: categoria.nome,
    tipo: categoria.tipo,
    icone: categoria.icone,
    arquivadaEm: categoria.arquivadaEm?.toISOString() ?? null,
  };
}

async function buscarCategoriaDoUsuario(usuarioId: string, id: string) {
  const categoria = await prisma.categoria.findFirst({
    where: { id, usuarioId },
  });

  if (!categoria) {
    throw new NotFoundError('Categoria não encontrada.');
  }

  return categoria;
}

/**
 * O unique do banco diferencia maiúsculas ("Mercado" x "mercado"),
 * então a checagem sem distinção de case acontece aqui.
 */
async function garantirNomeDisponivel(
  usuarioId: string,
  tipo: TipoCategoria,
  nome: string,
  ignorarId?: string,
) {
  const existente = await prisma.categoria.findFirst({
    where: {
      usuarioId,
      tipo,
      nome: { equals: nome, mode: 'insensitive' },
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
    },
    select: { arquivadaEm: true },
  });

  if (existente) {
    throw new ConflictError(
      existente.arquivadaEm
        ? 'Já existe uma categoria arquivada com esse nome. Restaure-a em vez de criar outra.'
        : 'Já existe uma categoria com esse nome.',
    );
  }
}

function relancarSeNomeDuplicado(error: unknown): never {
  // corrida entre a checagem e a escrita: o unique do banco barra
  if (isUniqueViolation(error)) {
    throw new ConflictError('Já existe uma categoria com esse nome.');
  }
  throw error;
}

export async function listarCategorias(
  usuarioId: string,
  query: ListarCategoriasQuery,
) {
  const categorias = await prisma.categoria.findMany({
    where: {
      usuarioId,
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.incluirArquivadas ? {} : { arquivadaEm: null }),
    },
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
  });

  return categorias.map(serializarCategoria);
}

export async function buscarCategoria(usuarioId: string, id: string) {
  return serializarCategoria(await buscarCategoriaDoUsuario(usuarioId, id));
}

export async function criarCategoria(
  usuarioId: string,
  input: CriarCategoriaInput,
) {
  await garantirNomeDisponivel(usuarioId, input.tipo, input.nome);

  const categoria = await prisma.categoria
    .create({ data: { ...input, usuarioId } })
    .catch(relancarSeNomeDuplicado);

  return serializarCategoria(categoria);
}

export async function atualizarCategoria(
  usuarioId: string,
  id: string,
  input: AtualizarCategoriaInput,
) {
  const categoria = await buscarCategoriaDoUsuario(usuarioId, id);

  if (categoria.arquivadaEm) {
    throw new ConflictError('Categoria arquivada não pode ser alterada.');
  }

  if (input.nome) {
    await garantirNomeDisponivel(usuarioId, categoria.tipo, input.nome, id);
  }

  const atualizada = await prisma.categoria
    .update({ where: { id }, data: input })
    .catch(relancarSeNomeDuplicado);

  return serializarCategoria(atualizada);
}

export async function arquivarCategoria(usuarioId: string, id: string) {
  const categoria = await buscarCategoriaDoUsuario(usuarioId, id);

  if (categoria.arquivadaEm) {
    throw new ConflictError('Categoria já está arquivada.');
  }

  await prisma.categoria.update({
    where: { id },
    data: { arquivadaEm: new Date() },
  });
}

export async function restaurarCategoria(usuarioId: string, id: string) {
  const categoria = await buscarCategoriaDoUsuario(usuarioId, id);

  if (!categoria.arquivadaEm) {
    throw new ConflictError('Categoria não está arquivada.');
  }

  const restaurada = await prisma.categoria.update({
    where: { id },
    data: { arquivadaEm: null },
  });

  return serializarCategoria(restaurada);
}
