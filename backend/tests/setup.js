// ============================================================================
// File: backend/tests/setup.js
// Description: Global test environment setup
// ============================================================================

import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-taskflow-2026-production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
