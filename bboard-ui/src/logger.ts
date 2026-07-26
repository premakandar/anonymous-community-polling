import * as pino from 'pino';

export const logger = pino.pino({
  level: (import.meta.env.VITE_LOGGING_LEVEL as string) || 'info',
});
