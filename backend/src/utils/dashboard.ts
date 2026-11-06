export const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const parseAreaIds = (areaIdsRaw: unknown): number[] => {
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

export const isValidDateInput = (date?: string): boolean => {
  if (!date) {
    return true;
  }

  if (!datePattern.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

export const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildDashboardWhereClause = (
  areaIds: number[],
  dateFrom?: string,
  dateTo?: string,
): { whereSql: string; whereParams: Array<number | string> } => {
  const whereParts: string[] = [`s.area_id IN (${areaIds.map(() => '?').join(',')})`];
  const whereParams: Array<number | string> = [...areaIds];

  if (dateFrom) {
    whereParts.push('rp.tanggal >= ?');
    whereParams.push(dateFrom);
  }

  if (dateTo) {
    whereParts.push('rp.tanggal < DATE_ADD(?, INTERVAL 1 DAY)');
    whereParams.push(dateTo);
  }

  return {
    whereSql: `WHERE ${whereParts.join(' AND ')}`,
    whereParams,
  };
};

export const makeAreaOrderSorter = (areaIds: number[]) => {
  const areaOrder = new Map(areaIds.map((id, index) => [id, index]));

  return (leftId: number, rightId: number): number =>
    (areaOrder.get(leftId) ?? Number.MAX_SAFE_INTEGER) -
    (areaOrder.get(rightId) ?? Number.MAX_SAFE_INTEGER);
};
