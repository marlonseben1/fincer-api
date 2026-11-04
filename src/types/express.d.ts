import type { JwtPayload } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}
