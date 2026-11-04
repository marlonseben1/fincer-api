import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from '../lib/cookies.js';
import { UnauthorizedError } from '../lib/errors.js';
import { verificarToken } from '../lib/jwt.js';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    throw new UnauthorizedError('Sessão ausente ou expirada.');
  }

  try {
    req.usuario = verificarToken(token);
  } catch {
    throw new UnauthorizedError('Sessão ausente ou expirada.');
  }

  next();
}
