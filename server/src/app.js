import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Sentry Error Monitoring ────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.3,
  });
  // Sentry request handler must be first middleware
  app.use(Sentry.expressIntegration().requestHandler);
}

// ── Rate Limiting ──────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // strict: 10 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. Please try again later.' },
});

// ── Middlewares ─────────────────────────────────────────────────────
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Routes ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'ITsharing API is running...' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', resourceRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);

// Backend Admin Dashboard Routes
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Serve index.html or login.html explicitly for SPA-like navigation in backend dashboard
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/login.html')));

// ── Sentry error handler (must be before other error handlers) ─────
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressIntegration().errorHandler);
}

// Use error middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
