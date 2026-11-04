import jwt from 'jsonwebtoken';
import { env } from '../config/config.js';

export interface JwtPayload {
  sub: string;
}

export function assinarToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

export function verificarToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  }) as JwtPayload;
}
