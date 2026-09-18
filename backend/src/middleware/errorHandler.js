// ============================================================================
// File: backend/src/middleware/errorHandler.js
// Description: Global application and Prisma exception handling middleware
//
// LEARNING NOTES — HOW CENTRALIZED ERROR HANDLING WORKS:
// 1. KNOWN BUSINESS ERRORS: Instances of AppError carry custom status codes (e.g., 400, 403, 404).
// 2. PRISMA DATABASE CODES:
//    - P2002: Unique constraint violation (maps to 409 Conflict, e.g. duplicate periodKey).
//    - P2025: Record not found (maps to 404 Not Found).
// 3. UNEXPECTED ERRORS: Logged to stderr and normalized to a safe 500 Internal Server Error.
// ============================================================================

import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  // AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // CORS origin rejection
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Not allowed by CORS'
    });
  }

  // Prisma unique constraint violation code P2002
  if (err.code === 'P2002') {
    const target = err.meta?.target;
    const msg = (Array.isArray(target) && target.includes('periodKey')) || err.message?.includes('periodKey')
      ? 'Duplicate recurring engagement'
      : 'Duplicate record';

    return res.status(409).json({
      error: msg
    });
  }

  // Prisma record not found code P2025
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found'
    });
  }

  // Prisma table does not exist (migrations not run) code P2021
  if (err.code === 'P2021') {
    console.error(`[Prisma Schema Error] Missing table:`, err.message);
    return res.status(500).json({
      error: 'Database schema is not initialized. Please run: npm run migrate:deploy'
    });
  }

  // Prisma connection failure
  if (err.name === 'PrismaClientInitializationError') {
    console.error(`[Prisma Connection Error]:`, err.message);
    return res.status(503).json({
      error: 'Database connection failed. Please verify DATABASE_URL and network configuration.'
    });
  }

  // Prisma pool timeout code P2024
  if (err.code === 'P2024') {
    console.error(`[Prisma Pool Timeout]:`, err.message);
    return res.status(503).json({
      error: 'Database connection timed out. Please verify Neon connection pooling.'
    });
  }

  // Unhandled / server errors
  console.error(`[Error] ${req.method} ${req.originalUrl} - User: ${req.user?.id || 'anonymous'} - Details:`, err);
  return res.status(500).json({
    error: 'Internal server error'
  });
}
