import type { Request, Response } from 'express';
import { HttpStatus } from '../constants/http-status.js';

export function notFound(_req: Request, res: Response): void {
  res
    .status(HttpStatus.NOT_FOUND)
    .json({ success: false, message: 'Rota não encontrada.' });
}
