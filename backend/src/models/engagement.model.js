// ============================================================================
// File: backend/src/models/engagement.model.js
// Description: Engagement data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findMany(where = {}, options = {}) {
  const client = options.tx || prisma;
  const query = {
    where,
    include: options.include || {
      client: { select: { id: true, name: true } },
      serviceType: { select: { id: true, name: true, code: true, isRecurring: true, recurrenceInterval: true } },
      manager: { select: { id: true, fullName: true, email: true } },
      tasks: { select: { id: true, status: true } }
    },
    orderBy: options.orderBy || { periodStart: 'desc' }
  };
  if (options.skip !== undefined) query.skip = options.skip;
  if (options.take !== undefined) query.take = options.take;
  return client.engagement.findMany(query);
}

export async function count(where = {}) {
  if (typeof prisma.engagement.count === 'function') {
    return prisma.engagement.count({ where });
  }
  return 0;
}

export async function findById(id, options = {}) {
  const client = options.tx || prisma;
  return client.engagement.findUnique({
    where: { id },
    include: options.include || {
      client: true,
      serviceType: true,
      manager: { select: { id: true, fullName: true, email: true } },
      tasks: {
        include: {
          assignee: { select: { id: true, fullName: true, email: true } },
          reviewer: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { dueDate: 'asc' }
      }
    }
  });
}

export async function findByPeriodKey(clientId, serviceTypeId, periodKey, tx) {
  const client = tx || prisma;
  return client.engagement.findUnique({
    where: {
      clientId_serviceTypeId_periodKey: {
        clientId,
        serviceTypeId,
        periodKey
      }
    }
  });
}

export async function create(data, tx) {
  const client = tx || prisma;
  return client.engagement.create({
    data
  });
}

export async function update(id, data, tx) {
  const client = tx || prisma;
  return client.engagement.update({
    where: { id },
    data
  });
}

export default {
  findMany,
  findById,
  findByPeriodKey,
  count,
  create,
  update
};
