// ============================================================================
// File: server/src/config/prisma.js
// Description: Prisma Client connection singleton
// ============================================================================

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['error', 'warn']
});

export default prisma;
