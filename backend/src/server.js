import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { initDb } from './db.js';
import { requireAuth } from './auth.js';
import { ensureAdmin } from './auth.js';
import { apiLimiter, errorHandler, notFound } from './middleware.js';

import authRoutes from './routes/auth.routes.js';
import crudRoutes from './routes/crud.routes.js';
import adminRoutes from './routes/admin.routes.js';
import portalRoutes from './routes/portal.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import backupRoutes from './routes/backup.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

const allowedOrigins = new Set([config.clientUrl]);
if (config.clientUrl.includes('localhost')) allowedOrigins.add(config.clientUrl.replace('localhost', '127.0.0.1'));
if (config.clientUrl.includes('127.0.0.1')) allowedOrigins.add(config.clientUrl.replace('127.0.0.1', 'localhost'));
const isLocalOrigin = origin => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isLocalOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(apiLimiter);

// Static uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/v1/health', (req, res) => res.json({ ok: true, service: 'AcademyPro', version: '2.0' }));

// Public routes
app.use('/api/v1/auth', authRoutes);

// Protected routes
app.use('/api/v1/dashboard', requireAuth, dashboardRoutes);
app.use('/api/v1', requireAuth, crudRoutes);
app.use('/api/v1/admin', requireAuth, adminRoutes);
app.use('/api/v1/portal', requireAuth, portalRoutes);
app.use('/api/v1/reports', requireAuth, reportsRoutes);
app.use('/api/v1/backup', requireAuth, backupRoutes);
app.use('/api/v1/settings', requireAuth, settingsRoutes);

// 404 - catch-all for unmatched API routes (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Endpoint not found' });
  }
  next();
});

// Error handler
app.use(errorHandler);

// Start
initDb()
  .then(() => {
    return ensureAdmin();
  })
  .then(() => {
    app.listen(config.port, () => {
      console.log(`AcademyPro API running on http://localhost:${config.port}`);
    });
  })
  .catch((e) => {
    console.error('Failed to initialize database:', e);
    process.exit(1);
  });
