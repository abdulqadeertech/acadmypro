import rateLimit from 'express-rate-limit';
import { config } from './config.js';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many login attempts, please try again later' },
});

export function validateBody(required = []) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    const missing = required.filter(f => !req.body[f] && req.body[f] !== 0);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    next();
  };
}

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message, err.stack?.split('\n')[1] || '');
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ message });
}

export function notFound(req, res) {
  res.status(404).json({ message: 'Endpoint not found' });
}

export function sanitizeBody(allowed = []) {
  return (req, res, next) => {
    if (req.body && allowed.length) {
      const clean = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) clean[key] = req.body[key];
      }
      req.body = clean;
    }
    next();
  };
}
