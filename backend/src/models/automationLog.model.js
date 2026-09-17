// ============================================================================
// File: backend/src/models/automationLog.model.js
// Description: Automation Log data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findMany(where = {}, options = {}) {
  const client = options.tx || prisma;
  return client.automationLog.findMany({
    where,
    orderBy: options.orderBy || { runAt: 'desc' },
    take: options.limit || 50
  });
}

export async function create(data, tx) {
  const client = tx || prisma;
  return client.automationLog.create({
    data
  });
}

export default {
  findMany,
  create
};
