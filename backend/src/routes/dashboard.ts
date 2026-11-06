import { Router } from 'express';
import { MAX_AREA_IDS } from '../config';
import { getReqId, log } from '../lib/logger';
import { getDashboard } from '../services/dashboard-service';
import { isValidDateInput, parseAreaIds } from '../utils/dashboard';

export const dashboardRouter = Router();

dashboardRouter.get('/api/dashboard', async (req, res) => {
  const reqId = getReqId(res);

  const areaIds = parseAreaIds(req.query.areaIds);
  const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined;
  const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined;

  log('INFO', reqId, 'dashboard params received', {
    areaIds,
    dateFrom: dateFrom ?? null,
    dateTo: dateTo ?? null,
  });

  if (!areaIds.length) {
    log('WARN', reqId, 'validation failed: areaIds is empty or invalid');
    return res.status(400).json({ message: 'Query parameter areaIds is required' });
  }

  if (areaIds.length > MAX_AREA_IDS) {
    log('WARN', reqId, 'validation failed: areaIds exceeds limit', { total: areaIds.length });
    return res.status(400).json({ message: `areaIds must not exceed ${MAX_AREA_IDS} items` });
  }

  if (!isValidDateInput(dateFrom) || !isValidDateInput(dateTo)) {
    log('WARN', reqId, 'validation failed: invalid date format');
    return res
      .status(400)
      .json({ message: 'dateFrom and dateTo must be valid dates in YYYY-MM-DD format when provided' });
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    log('WARN', reqId, 'validation failed: dateFrom is greater than dateTo');
    return res.status(400).json({ message: 'dateFrom must be less than or equal to dateTo' });
  }

  try {
    const { data, source } = await getDashboard({ reqId, areaIds, dateFrom, dateTo });

    log('INFO', reqId, 'dashboard generated', {
      source,
      chartRows: data.chart.length,
      brands: data.table.length,
    });

    return res.json(data);
  } catch (error) {
    log('ERROR', reqId, 'failed to fetch dashboard data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});
