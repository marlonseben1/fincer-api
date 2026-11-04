import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/config.js';
import { prisma } from '../../db/prisma.js';
import type { Usuario } from '../../generated/prisma/client.js';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors.js';
import { assinarToken } from '../../lib/jwt.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function serializarUsuario(usuario: Usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
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
