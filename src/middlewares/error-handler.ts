import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/config.js';
import { HttpStatus } from '../constants/http-status.js';
import { HttpError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    if (error.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      logger.error(
        { err: error, path: req.path, method: req.method },
        error.message,
      );
    }

    res.status(error.status).json({
      success: false,
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  logger.error(
    { err: error, path: req.path, method: req.method },
    'Erro não tratado',
  );

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Erro interno do servidor.',
    ...(env.NODE_ENV !== 'production' && {
      detail: error instanceof Error ? error.message : String(error),
    }),
  });
}
