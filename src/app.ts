import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/config.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';

export const app = express();

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      remove: true,
    },
  }),
);
app.use(helmet());
app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFound);
app.use(errorHandler);
