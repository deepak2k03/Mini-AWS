import { ZodError } from 'zod';
import { config } from './config.js';

export function requireAuth(req, res, next) {
  // Development-only identity. Replace with verified JWT/session claims in production.
  const userId = config.DEMO_AUTH ? (req.header('x-user-id') || 'local-user') : null;
  if (!userId) return res.status(401).json({ message: 'Authentication required' });
  req.auth = { userId };
  next();
}

export function notFound(_req, res) {
  res.status(404).json({ message: 'Not found' });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) return res.status(400).json({ message: 'Invalid request', errors: error.flatten() });
  const status = error.statusCode || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'Internal server error' : error.message });
}
