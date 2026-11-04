import { pino } from 'pino';
import { env } from '../config/config.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});
