import { app } from './app.js';
import { env } from './config/config.js';
import { logger } from './lib/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info({ porta: env.PORT }, 'API rodando.');
});

let encerrando = false;

function encerrar(sinal: string): void {
  if (encerrando) return;
  encerrando = true;

  logger.info({ sinal }, 'Encerrando o servidor...');
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});
