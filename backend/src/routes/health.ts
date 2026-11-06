import { Router } from 'express';
import { pool } from '../db';
import { getReqId, log, timed } from '../lib/logger';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const reqId = getReqId(res);

  try {
    await timed(reqId, 'health query', () => pool.query('SELECT 1'));
    log('INFO', reqId, 'health check passed');
    return res.json({ status: 'ok' });
  } catch (error) {
    log('ERROR', reqId, 'health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ status: 'error' });
  }
});
