// ============================================================================
// File: backend/src/models/serviceType.model.js
// Description: Service Type data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findMany(where = {}, options = {}) {
  return prisma.serviceType.findMany({
    where,
    include: options.include || undefined,
    orderBy: options.orderBy || { name: 'asc' }
  });
}

export async function findById(id, options = {}) {
  return prisma.serviceType.findUnique({
    where: { id },
    include: options.include || undefined
  });
}

export async function findByCode(code) {
  return prisma.serviceType.findUnique({
    where: { code: code.toUpperCase() }
  });
}

export async function create(data) {
  return prisma.serviceType.create({
    data: {
      ...data,
      code: data.code.toUpperCase()
    }
  });
}

export async function update(id, data) {
  return prisma.serviceType.update({
    where: { id },
    data
  });
}

export default {
  findMany,
  findById,
  findByCode,
  create,
  update
};
