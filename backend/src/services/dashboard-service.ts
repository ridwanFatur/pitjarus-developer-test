import { CACHE_MAX_ENTRIES, DASHBOARD_CACHE_TTL_MS } from '../config';
import { pool } from '../db';
import { timed } from '../lib/logger';
import { TtlCache } from '../lib/ttl-cache';
import {
  buildDashboardWhereClause,
  makeAreaOrderSorter,
  toNumber,
} from '../utils/dashboard';
import {
  AreaCompliance,
  BrandCompliance,
  ChartRow,
  DashboardPayload,
  TableRow,
} from '../types/dashboard';

const dashboardCache = new TtlCache<DashboardPayload>(
  DASHBOARD_CACHE_TTL_MS,
  CACHE_MAX_ENTRIES,
);

type GetDashboardArgs = {
  reqId: string;
  areaIds: number[];
  dateFrom?: string;
  dateTo?: string;
};

export const getDashboard = async ({
  reqId,
  areaIds,
  dateFrom,
  dateTo,
}: GetDashboardArgs): Promise<{ data: DashboardPayload; source: 'cache' | 'inflight' | 'db' }> => {
  const cacheKey = `${areaIds.join(',')}|${dateFrom ?? ''}|${dateTo ?? ''}`;
  const byAreaOrder = makeAreaOrderSorter(areaIds);

  const { value, source } = await dashboardCache.getOrLoad(cacheKey, async () => {
    const { whereSql, whereParams } = buildDashboardWhereClause(areaIds, dateFrom, dateTo);

    const chartSql = `
      SELECT
        sa.area_id,
        sa.area_name,
        ROUND((SUM(rp.compliance) / COUNT(rp.report_id)) * 100, 2) AS compliance_percentage
      FROM report_product rp
      INNER JOIN store s ON s.store_id = rp.store_id
      INNER JOIN store_area sa ON sa.area_id = s.area_id
      ${whereSql}
      GROUP BY sa.area_id, sa.area_name
    `;

    const tableSql = `
      SELECT
        pb.brand_id,
        pb.brand_name,
        sa.area_id,
        sa.area_name,
        ROUND((SUM(rp.compliance) / COUNT(rp.report_id)) * 100, 2) AS compliance_percentage
      FROM report_product rp
      INNER JOIN store s ON s.store_id = rp.store_id
      INNER JOIN store_area sa ON sa.area_id = s.area_id
      INNER JOIN product p ON p.product_id = rp.product_id
      INNER JOIN product_brand pb ON pb.brand_id = p.brand_id
      ${whereSql}
      GROUP BY pb.brand_id, pb.brand_name, sa.area_id, sa.area_name
      ORDER BY pb.brand_id ASC, sa.area_id ASC
    `;

    const [[chartRows], [tableRows]] = await Promise.all([
      timed(reqId, 'chart query', () => pool.query<ChartRow[]>(chartSql, whereParams)),
      timed(reqId, 'table query', () => pool.query<TableRow[]>(tableSql, whereParams)),
    ]);

    const chart: AreaCompliance[] = chartRows
      .map((row) => ({
        area_id: row.area_id,
        area_name: row.area_name,
        compliance_percentage: toNumber(row.compliance_percentage),
      }))
      .sort((left, right) => byAreaOrder(left.area_id, right.area_id));

    const tableMap = new Map<number, BrandCompliance>();

    for (const row of tableRows) {
      const area: AreaCompliance = {
        area_id: row.area_id,
        area_name: row.area_name,
        compliance_percentage: toNumber(row.compliance_percentage),
      };

      const existing = tableMap.get(row.brand_id);

      if (existing) {
        existing.areas.push(area);
      } else {
        tableMap.set(row.brand_id, {
          brand_id: row.brand_id,
          brand_name: row.brand_name,
          areas: [area],
        });
      }
    }

    const table = Array.from(tableMap.values()).map((brand) => {
      brand.areas.sort((left, right) => byAreaOrder(left.area_id, right.area_id));
      return brand;
    });

    return { chart, table };
  });

  return { data: value, source };
};
