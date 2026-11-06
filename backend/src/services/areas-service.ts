import { AREAS_CACHE_TTL_MS } from '../config';
import { pool } from '../db';
import { timed } from '../lib/logger';
import { TtlCache } from '../lib/ttl-cache';
import { Area } from '../types/dashboard';

const areasCache = new TtlCache<Area[]>(AREAS_CACHE_TTL_MS, 1);

export const getAreas = async (reqId: string): Promise<{ data: Area[]; source: 'cache' | 'inflight' | 'db' }> => {
  const { value, source } = await areasCache.getOrLoad('areas', async () => {
    const [rows] = await timed(reqId, 'areas query', () =>
      pool.query<Area[]>('SELECT area_id, area_name FROM store_area ORDER BY area_id ASC'),
    );

    return rows;
  });

  return { data: value, source };
};
