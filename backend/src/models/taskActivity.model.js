// ============================================================================
// File: backend/src/models/taskActivity.model.js
// Description: Task Activity data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findManyByTaskId(taskId) {
  return prisma.taskActivity.findMany({
    where: { taskId },
    include: {
      actor: { select: { id: true, fullName: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function create(data, tx) {
  const client = tx || prisma;
  return client.taskActivity.create({
    data
  });
}

export default {
  findManyByTaskId,
  create
};
