// ============================================================================
// File: backend/src/services/serviceType.service.js
// Description: Service Type catalog domain logic
// ============================================================================

import serviceTypeModel from '../models/serviceType.model.js';
import { AppError } from '../utils/errors.js';

export async function getServiceTypes() {
  return serviceTypeModel.findMany();
}

export async function createServiceType(input) {
  const code = input.code.trim().toUpperCase();
  const existing = await serviceTypeModel.findByCode(code);
  if (existing) {
    throw new AppError('Service type with this code already exists', 409);
  }

  return serviceTypeModel.create({
    name: input.name.trim(),
    code,
    description: input.description || null,
    isRecurring: Boolean(input.isRecurring),
    recurrenceInterval: input.isRecurring ? input.recurrenceInterval : null
  });
}

export async function updateServiceType(id, input) {
  const existing = await serviceTypeModel.findById(id);
  if (!existing) {
    throw new AppError('Service type not found', 404);
  }

  const data = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.code !== undefined) data.code = input.code.trim().toUpperCase();
  if (input.description !== undefined) data.description = input.description;
  if (input.isRecurring !== undefined) {
    data.isRecurring = Boolean(input.isRecurring);
    data.recurrenceInterval = input.isRecurring ? input.recurrenceInterval : null;
  }
  if (input.recurrenceInterval !== undefined && input.isRecurring !== false) {
    data.recurrenceInterval = input.recurrenceInterval;
  }
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return serviceTypeModel.update(id, data);
}

export default {
  getServiceTypes,
  createServiceType,
  updateServiceType
};
