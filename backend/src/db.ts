import 'dotenv/config';
import mysql from 'mysql2/promise';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: toNumber(process.env.DB_PORT, 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
