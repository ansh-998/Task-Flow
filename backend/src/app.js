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

// Security headers
app.use(helmet());

// HTTP response compression
app.use(compression());

// Global CORS - locked to CLIENT_ORIGINS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (env.CLIENT_ORIGINS.includes('*') || env.CLIENT_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

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
