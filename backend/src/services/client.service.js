// ============================================================================
// File: backend/src/services/client.service.js
// Description: Client domain operations and profile lifecycle
// ============================================================================

import clientModel from '../models/client.model.js';
import { AppError } from '../utils/errors.js';

export async function getClients(pagination = {}) {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    clientModel.findMany({}, { skip, take: limit }),
    clientModel.count()
  ]);

  return { data, page, limit, total };
}

export async function createClient(input, userId) {
  const name = input.name ? input.name.trim() : '';
  if (!name) {
    throw new AppError('Client name is required', 400);
  }

  const existing = await clientModel.findByName(name);
  if (existing) {
    throw new AppError('Client with this name already exists', 409);
  }

  const contactEmail = input.contactEmail || input.email || null;
  const phone = input.phone || null;
  const status = input.status || (input.isActive === false ? 'inactive' : 'active');

  return clientModel.create({
    name,
    contactEmail,
    phone,
    status,
    ...(userId ? { createdById: userId } : {})
  });
}

export async function updateClient(id, input) {
  const existing = await clientModel.findById(id);
  if (!existing) {
    throw new AppError('Client not found', 404);
  }

  const data = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail || null;
  else if (input.email !== undefined) data.contactEmail = input.email || null;
  if (input.phone !== undefined) data.phone = input.phone || null;
  if (input.status !== undefined) data.status = input.status;
  else if (input.isActive !== undefined) data.status = input.isActive ? 'active' : 'inactive';

  return clientModel.update(id, data);
}

export default {
  getClients,
  createClient,
  updateClient
};
