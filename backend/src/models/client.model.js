// ============================================================================
// File: backend/src/models/client.model.js
// Description: Client data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findMany(where = {}, options = {}) {
  const query = {
    where,
    include: options.include || undefined,
    orderBy: options.orderBy || { name: 'asc' }
  };
  if (options.skip !== undefined) query.skip = options.skip;
  if (options.take !== undefined) query.take = options.take;
  return prisma.client.findMany(query);
}

export async function count(where = {}) {
  if (typeof prisma.client.count === 'function') {
    return prisma.client.count({ where });
  }
  return 0;
}

export async function findById(id, options = {}) {
  return prisma.client.findUnique({
    where: { id },
    include: options.include || undefined
  });
}

export async function findByName(name) {
  return prisma.client.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } }
  });
}

export async function create(data) {
  return prisma.client.create({
    data
  });
}

export async function update(id, data) {
  return prisma.client.update({
    where: { id },
    data
  });
}

export default {
  findMany,
  findById,
  findByName,
  count,
  create,
  update
};
