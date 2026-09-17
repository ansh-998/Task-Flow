// ============================================================================
// File: backend/src/services/taskTemplate.service.js
// Description: Task blueprint template logic per service type
// ============================================================================

import taskTemplateModel from '../models/taskTemplate.model.js';
import serviceTypeModel from '../models/serviceType.model.js';
import { AppError } from '../utils/errors.js';

export async function getTemplates(serviceTypeId) {
  return taskTemplateModel.findManyByServiceId(serviceTypeId);
}

export async function createTemplate(serviceTypeId, input) {
  const service = await serviceTypeModel.findById(serviceTypeId);
  if (!service) {
    throw new AppError('Service type not found', 404);
  }

  return taskTemplateModel.create({
    serviceTypeId,
    title: input.title.trim(),
    description: input.description || null,
    orderIndex: input.orderIndex !== undefined ? input.orderIndex : 0,
    offsetDaysFromPeriodStart: input.offsetDaysFromPeriodStart !== undefined ? input.offsetDaysFromPeriodStart : 0,
    defaultAssigneeRole: input.defaultAssigneeRole || null,
    requiresReview: input.requiresReview !== undefined ? input.requiresReview : true
  });
}

export async function updateTemplate(id, input) {
  const existing = await taskTemplateModel.findById(id);
  if (!existing) {
    throw new AppError('Task template not found', 404);
  }

  const data = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) data.description = input.description;
  if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex;
  if (input.offsetDaysFromPeriodStart !== undefined) data.offsetDaysFromPeriodStart = input.offsetDaysFromPeriodStart;
  if (input.defaultAssigneeRole !== undefined) data.defaultAssigneeRole = input.defaultAssigneeRole;
  if (input.requiresReview !== undefined) data.requiresReview = input.requiresReview;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return taskTemplateModel.update(id, data);
}

export default {
  getTemplates,
  createTemplate,
  updateTemplate
};
