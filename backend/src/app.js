// ============================================================================
// File: backend/src/app.js
// Description: Express application definition, middleware, and route mounting
// ============================================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import apiRouter from './routes/index.js';
import healthController from './controllers/health.controller.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';
import env from './config/env.js';

export const app = express();

// Security headers - allow cross-origin API access for frontend SPA
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// HTTP response compression
app.use(compression());

// Origin validation supporting wildcard, configured domains, and any Vercel deployment
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow non-browser requests (curl, server-to-server, health probes)
  const normalized = origin.trim().replace(/\/+$/, '').toLowerCase();

  // Allow wildcard
  if (env.CLIENT_ORIGINS.includes('*')) return true;

  // Check against explicitly configured CLIENT_ORIGINS
  if (env.CLIENT_ORIGINS.some((allowed) => allowed.toLowerCase().replace(/\/+$/, '') === normalized)) {
    return true;
  }

  // Allow any Vercel production or preview deployment (*.vercel.app)
  if (/^https:\/\/[a-z0-9-_.]+\.vercel\.app$/.test(normalized)) {
    return true;
  }

  // Allow localhost for dev / testing
  if (/^http:\/\/localhost(:\d+)?$/.test(normalized)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-secret']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parser with 100kb size limit
app.use(express.json({ limit: '100kb' }));

// Root health check endpoints for cloud load balancers and container monitors
app.get('/', healthController.getHealth);
app.get('/health', healthController.getHealth);

// API Routes
app.use('/api', apiRouter);

// 404 handler for unknown routes
app.use('*', (req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));

// Centralized error handling
app.use(errorHandler);

export default app;
