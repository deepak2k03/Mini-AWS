import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { errorHandler, notFound, requireAuth } from './middleware.js';
import { instancesRouter } from './routes/instances.js';

export const app = express();
app.use(pinoHttp());
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/instances', rateLimit({ windowMs: 60_000, limit: 60 }), requireAuth, instancesRouter);
app.use(notFound);
app.use(errorHandler);
