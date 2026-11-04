import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/config.js';
import { prisma } from '../../db/prisma.js';
import type { Usuario } from '../../generated/prisma/client.js';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../lib/errors.js';
import { assinarToken } from '../../lib/jwt.js';
import { CATEGORIAS_INICIAIS } from '../categorias/categorias.constants.js';
import type { OnboardingInput } from './auth.schemas.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function serializarUsuario(usuario: Usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    onboardingConcluidoEm: usuario.onboardingConcluidoEm?.toISOString() ?? null,
  };
}

export async function loginComGoogle(googleToken: string) {
  const ticket = await googleClient
    .verifyIdToken({ idToken: googleToken, audience: env.GOOGLE_CLIENT_ID })
    .catch(() => {
      throw new UnauthorizedError('Token do Google inválido.');
    });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw new UnauthorizedError('Token do Google inválido.');
  }

  const email = payload.email.toLowerCase();

  if (!env.ALLOWED_LOGIN_EMAILS.includes(email)) {
    throw new ForbiddenError('Este e-mail não tem acesso ao Fincer.');
  }

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      email,
      nome: payload.name ?? email.split('@')[0] ?? email,
    },
  });

  const token = assinarToken({ sub: usuario.id });

  return { token, usuario: serializarUsuario(usuario) };
}

export async function buscarUsuarioAtual(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!usuario) {
    throw new UnauthorizedError();
  }

  return serializarUsuario(usuario);
}

export async function concluirOnboarding(
  usuarioId: string,
  input: OnboardingInput,
) {
  const usuario = await prisma.$transaction(async (tx) => {
    // update condicional: se duas requisições chegarem juntas, só a primeira
    // encontra onboardingConcluidoEm = null; a segunda atualiza 0 linhas
    const { count } = await tx.usuario.updateMany({
      where: { id: usuarioId, onboardingConcluidoEm: null },
      data: { nome: input.nome, onboardingConcluidoEm: new Date() },
    });

    if (count === 0) {
      const existe = await tx.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true },
      });

      throw existe
        ? new ConflictError('Onboarding já foi concluído.')
        : new UnauthorizedError();
    }

    const conta = await tx.conta.create({
      data: { ...input.contaPrincipal, usuarioId },
    });

    if (input.categoriasIniciais) {
      await tx.categoria.createMany({
        data: CATEGORIAS_INICIAIS.map((categoria) => ({
          ...categoria,
          usuarioId,
        })),
        skipDuplicates: true, // caso já tenha criado alguma com o mesmo nome
      });
    }

    return tx.usuario.update({
      where: { id: usuarioId },
      data: { contaPadraoId: conta.id },
    });
  });

  return serializarUsuario(usuario);
}
