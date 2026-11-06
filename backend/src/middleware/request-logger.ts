import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { LogLevel, log } from '../lib/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const reqId = randomUUID().slice(0, 8);
  const startedAt = process.hrtime.bigint();

  res.locals.reqId = reqId;
  res.setHeader('X-Request-Id', reqId);

  log('INFO', reqId, `--> ${req.method} ${req.originalUrl}`, { ip: req.ip });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const level: LogLevel = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';

    log(level, reqId, `<-- ${req.method} ${req.originalUrl} ${res.statusCode}`, {
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
};
