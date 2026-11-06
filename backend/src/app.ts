import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { getReqId, log } from './lib/logger';
import { requestLogger } from './middleware/request-logger';
import { areasRouter } from './routes/areas';
import { dashboardRouter } from './routes/dashboard';
import { healthRouter } from './routes/health';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.use(areasRouter);
  app.use(dashboardRouter);
  app.use(healthRouter);

  app.use((req: Request, res: Response) => {
    log('WARN', getReqId(res), `route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Not found' });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    log('ERROR', getReqId(res), 'unhandled error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
};
