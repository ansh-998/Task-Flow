// ============================================================================
// File: backend/src/config/env.js
// Description: Centralized environment configuration loader
// ============================================================================

import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: Missing required environment variable: JWT_SECRET');
}

if (!process.env.DATABASE_URL) {
  throw new Error('FATAL: Missing required environment variable: DATABASE_URL');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  INTERNAL_SECRET: process.env.INTERNAL_SECRET || 'super-internal-secret-token'
};

export default env;
