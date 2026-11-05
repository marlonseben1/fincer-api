import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/config.js';
import { HttpStatus } from '../constants/http-status.js';
import { HttpError } from '../lib/index.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // body com JSON malformado: o express.json() lança SyntaxError com `body`
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'JSON inválido no corpo da requisição.',
      code: 'INVALID_JSON',
    });
    return;
  }

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
