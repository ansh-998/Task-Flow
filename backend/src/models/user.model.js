// ============================================================================
// File: backend/src/models/user.model.js
// Description: User data access operations using Prisma
// ============================================================================

import prisma from '../config/prisma.js';

export async function findById(id, select) {
  return prisma.user.findUnique({
    where: { id },
    select: select || undefined
  });
}

export async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
}

export async function findMany(where = {}, options = {}) {
  const query = {
    where,
    select: options.select || {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true
    },
    orderBy: options.orderBy || { fullName: 'asc' }
  };
  if (options.skip !== undefined) query.skip = options.skip;
  if (options.take !== undefined) query.take = options.take;
  return prisma.user.findMany(query);
}

export async function count(where = {}) {
  if (typeof prisma.user.count === 'function') {
    return prisma.user.count({ where });
  }
  return 0;
}

export async function create(data) {
  return prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase()
    }
  });
}

export async function update(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
}

export default {
  findById,
  findByEmail,
  findMany,
  count,
  create,
  update
};
