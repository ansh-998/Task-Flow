// ============================================================================
// File: backend/src/models/taskTemplate.model.js
// Description: Task Template data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findManyByServiceId(serviceTypeId, where = {}) {
  return prisma.taskTemplate.findMany({
    where: {
      serviceTypeId,
      ...where
    },
    orderBy: { orderIndex: 'asc' }
  });
}

export async function findById(id) {
  return prisma.taskTemplate.findUnique({
    where: { id }
  });
}

export async function create(data) {
  return prisma.taskTemplate.create({
    data
  });
}

export async function update(id, data) {
  return prisma.taskTemplate.update({
    where: { id },
    data
  });
}

export default {
  findManyByServiceId,
  findById,
  create,
  update
};
