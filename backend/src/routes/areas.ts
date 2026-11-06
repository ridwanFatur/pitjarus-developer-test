import { Router } from 'express';
import { getReqId, log } from '../lib/logger';
import { getAreas } from '../services/areas-service';

export const areasRouter = Router();

areasRouter.get('/api/areas', async (_req, res) => {
  const reqId = getReqId(res);

  try {
    const { data, source } = await getAreas(reqId);

    log('INFO', reqId, 'areas retrieved', { source, total: data.length });
    return res.json({ data });
  } catch (error) {
    log('ERROR', reqId, 'failed to fetch areas', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ message: 'Failed to fetch areas' });
  }
});
