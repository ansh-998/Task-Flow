// ============================================================================
// File: backend/src/models/task.model.js
// Description: Task data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findMany(where = {}, options = {}) {
  const client = options.tx || prisma;
  const query = {
    where,
    include: options.include || {
      engagement: {
        select: {
          id: true,
          title: true,
          periodKey: true,
          client: { select: { id: true, name: true } }
        }
      },
      assignee: { select: { id: true, fullName: true, email: true } },
      reviewer: { select: { id: true, fullName: true, email: true } }
    },
    orderBy: options.orderBy || [
      { dueDate: 'asc' },
      { createdAt: 'desc' }
    ]
  };
  if (options.skip !== undefined) query.skip = options.skip;
  if (options.take !== undefined) query.take = options.take;
  return client.task.findMany(query);
}

export async function findById(id, options = {}) {
  const client = options.tx || prisma;
  return client.task.findUnique({
    where: { id },
    include: options.include || {
      engagement: {
        include: {
          client: true,
          manager: { select: { id: true, fullName: true, email: true } }
        }
      },
      assignee: { select: { id: true, fullName: true, email: true } },
      reviewer: { select: { id: true, fullName: true, email: true } },
      activities: {
        include: {
          actor: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export async function count(where = {}) {
  if (typeof prisma.task.count === 'function') {
    return prisma.task.count({ where });
  }
  return 0;
}

export async function create(data, tx) {
  const client = tx || prisma;
  return client.task.create({
    data
  });
}

export async function createMany(data, tx) {
  const client = tx || prisma;
  return client.task.createMany({
    data
  });
}

export async function update(id, data, tx) {
  const client = tx || prisma;
  return client.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, fullName: true, email: true } },
      reviewer: { select: { id: true, fullName: true, email: true } }
    }
  });
}

export default {
  findMany,
  findById,
  count,
  create,
  createMany,
  update
};
