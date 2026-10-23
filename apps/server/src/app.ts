import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { requireAdmin } from './middleware/auth.js';

const app = express();
const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS policy does not allow this origin'));
    },
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRouter);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'counselling-web-app-api',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'server',
    environment: env.NODE_ENV,
  });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({
    ok: true,
    user: req.admin,
  });
});

app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  res.json({
    ok: true,
    stats: {
      openEnquiries: 0,
      upcomingSessions: 0,
      alerts: 0,
    },
  });
});

export default app;
