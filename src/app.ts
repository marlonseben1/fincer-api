import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/config.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFound } from './middlewares/index.js';
import {
  authRoutes,
  bancosRoutes,
  categoriasRoutes,
  contasRoutes,
  dashboardRoutes,
  fornecedoresRoutes,
  transacoesRoutes,
} from './modules/index.js';

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
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/v1/auth', authRoutes);
app.use('/v1/bancos', bancosRoutes);
app.use('/v1/categorias', categoriasRoutes);
app.use('/v1/contas', contasRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/fornecedores', fornecedoresRoutes);
app.use('/v1/transacoes', transacoesRoutes);

app.use(notFound);
app.use(errorHandler);
