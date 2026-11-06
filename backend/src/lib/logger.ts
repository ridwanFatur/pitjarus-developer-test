import { Response } from 'express';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export const log = (level: LogLevel, reqId: string, message: string, meta?: Record<string, unknown>) => {
  const line = `[${new Date().toISOString()}] [${level}] [${reqId}] ${message}`;
  const output = meta ? `${line} ${JSON.stringify(meta)}` : line;

  if (level === 'ERROR') {
    console.error(output);
    return;
  }

  if (level === 'WARN') {
    console.warn(output);
    return;
  }

  console.log(output);
};

export const getReqId = (res: Response): string => (res.locals.reqId as string) ?? 'no-req-id';

export const timed = async <T>(reqId: string, label: string, fn: () => Promise<T>): Promise<T> => {
  const startedAt = process.hrtime.bigint();

  try {
    return await fn();
  } finally {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    log('INFO', reqId, `${label} completed`, { durationMs: Number(durationMs.toFixed(2)) });
  }
};
