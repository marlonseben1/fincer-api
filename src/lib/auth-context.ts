import type { Request } from 'express';
import { UnauthorizedError } from './errors.js';

export function requireUsuarioId(req: Request): string {
  if (!req.usuario) {
    throw new UnauthorizedError();
  }

  return req.usuario.sub;
}
