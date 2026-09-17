import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.auth = { userId: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function notFound(_req, res) {
  res.status(404).json({ message: 'Not found' });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) return res.status(400).json({ message: 'Invalid request', errors: error.flatten() });
  const status = error.statusCode || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: error.message });
}
