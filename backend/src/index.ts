import { createApp } from './app';
import { PORT } from './config';
import { pool } from './db';

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] [INFO] Backend running at http://localhost:${PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`[${new Date().toISOString()}] [INFO] ${signal} received, closing server...`);

  server.close(async () => {
    try {
      await pool.end();
    } catch (error) {
      console.error('Failed to close DB pool:', error);
    }

    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
