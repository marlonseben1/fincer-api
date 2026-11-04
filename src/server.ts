import { app } from './app.js';
import { env } from './config/config.js';
import { prisma } from './db/prisma.js';
import { logger } from './lib/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info({ porta: env.PORT }, 'API rodando.');
});

let encerrando = false;

async function encerrar(sinal: string): Promise<void> {
  if (encerrando) return;
  encerrando = true;

  logger.info({ sinal }, 'Encerrando o servidor...');

  server.close(); // não aceita novas conexões
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});
