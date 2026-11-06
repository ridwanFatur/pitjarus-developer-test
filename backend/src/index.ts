import cors from 'cors';
import express, { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from './db';

const app = express();

app.use(cors());
app.use(express.json());

type Area = RowDataPacket & {
  area_id: number;
  area_name: string;
};

type ChartRow = RowDataPacket & {
  area_id: number;
  area_name: string;
  compliance_percentage: number;
};

type AreaCompliance = {
  area_id: number;
  area_name: string;
  compliance_percentage: number;
};

type TableRow = RowDataPacket & {
  brand_id: number;
  brand_name: string;
  area_id: number;
  area_name: string;
  compliance_percentage: number;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const parseAreaIds = (areaIdsRaw: unknown): number[] => {
  if (!areaIdsRaw || typeof areaIdsRaw !== 'string') {
    return [];
  }

  const uniqueIds = new Set<number>();

  for (const value of areaIdsRaw.split(',')) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      continue;
    }

    uniqueIds.add(parsed);
  }

  return Array.from(uniqueIds);
};

const isValidDateInput = (date?: string): boolean => {
  if (!date) {
    return true;
  }

  return datePattern.test(date);
};

const buildDashboardWhereClause = (
  areaIds: number[],
  dateFrom?: string,
  dateTo?: string,
): { whereSql: string; whereParams: Array<number | string> } => {
  const whereParts: string[] = [`sa.area_id IN (${areaIds.map(() => '?').join(',')})`];
  const whereParams: Array<number | string> = [...areaIds];

  if (dateFrom && dateTo) {
    whereParts.push('rp.tanggal BETWEEN ? AND ?');
    whereParams.push(dateFrom, dateTo);
  } else if (dateFrom) {
    whereParts.push('rp.tanggal >= ?');
    whereParams.push(dateFrom);
  } else if (dateTo) {
    whereParts.push('rp.tanggal <= ?');
    whereParams.push(dateTo);
  }

  return {
    whereSql: `WHERE ${whereParts.join(' AND ')}`,
    whereParams,
  };
};

app.get('/api/areas', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<Area[]>(
      'SELECT area_id, area_name FROM store_area ORDER BY area_id ASC',
    );

    res.json({ data: rows });
  } catch (error) {
    console.error('Failed to fetch areas:', error);
    res.status(500).json({ message: 'Failed to fetch areas' });
  }
});

app.get('/api/dashboard', async (req: Request, res: Response) => {
  const areaIds = parseAreaIds(req.query.areaIds);
  const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined;
  const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined;

  if (!areaIds.length) {
    return res.status(400).json({ message: 'Query parameter areaIds is required' });
  }

  if (!isValidDateInput(dateFrom) || !isValidDateInput(dateTo)) {
    return res
      .status(400)
      .json({ message: 'dateFrom and dateTo must be in YYYY-MM-DD format when provided' });
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return res.status(400).json({ message: 'dateFrom must be less than or equal to dateTo' });
  }

  const { whereSql, whereParams } = buildDashboardWhereClause(areaIds, dateFrom, dateTo);
  const areaOrder = new Map(areaIds.map((id, index) => [id, index]));

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

  try {
    const [chartRows] = await pool.query<ChartRow[]>(chartSql, whereParams);
    const [tableRows] = await pool.query<TableRow[]>(tableSql, whereParams);

    const chart = chartRows.sort((left, right) => {
      return (areaOrder.get(left.area_id) ?? Number.MAX_SAFE_INTEGER) -
        (areaOrder.get(right.area_id) ?? Number.MAX_SAFE_INTEGER);
    });

    const tableMap = new Map<number, { brand_id: number; brand_name: string; areas: AreaCompliance[] }>();

    for (const row of tableRows) {
      const existing = tableMap.get(row.brand_id);

      if (!existing) {
        tableMap.set(row.brand_id, {
          brand_id: row.brand_id,
          brand_name: row.brand_name,
          areas: [
            {
              area_id: row.area_id,
              area_name: row.area_name,
              compliance_percentage: row.compliance_percentage,
            },
          ],
        });
        continue;
      }

      existing.areas.push({
        area_id: row.area_id,
        area_name: row.area_name,
        compliance_percentage: row.compliance_percentage,
      });
    }

    const table = Array.from(tableMap.values()).map((brand) => {
      brand.areas.sort((left, right) => {
        return (areaOrder.get(left.area_id) ?? Number.MAX_SAFE_INTEGER) -
          (areaOrder.get(right.area_id) ?? Number.MAX_SAFE_INTEGER);
      });

      return brand;
    });

    return res.json({ chart, table });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({ status: 'error' });
  }
});

const port = Number(process.env.PORT ?? 8000);

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
