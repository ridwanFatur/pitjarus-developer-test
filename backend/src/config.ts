export const MAX_AREA_IDS = 100;
export const DASHBOARD_CACHE_TTL_MS = Number(process.env.DASHBOARD_CACHE_TTL_MS ?? 30_000);
export const AREAS_CACHE_TTL_MS = Number(process.env.AREAS_CACHE_TTL_MS ?? 60_000);
export const CACHE_MAX_ENTRIES = 200;
export const PORT = Number(process.env.PORT ?? 8000);
