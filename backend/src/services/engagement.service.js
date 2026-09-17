// ============================================================================
// File: backend/src/services/engagement.service.js
// Description: Engagement lifecycle, blueprint task replication, and access control
//
// LEARNING NOTES — HOW ENGAGEMENT & TEMPLATE CLONING WORKS:
// 1. TEMPLATE BLUEPRINT REPLICATION: When an engagement is created for a ServiceType,
//    all active TaskTemplates associated with that service are cloned into concrete Tasks.
// 2. DYNAMIC DUE DATES: Each cloned task's due date is calculated using:
//    dueDate = periodStart + template.offsetDaysFromPeriodStart.
// 3. ATOMICITY: The engagement, all tasks, and initial audit activities are wrapped
//    in a single prisma.$transaction so failures never leave orphaned records.
// 4. DUPLICATE PROTECTION: The unique constraint @@unique([clientId, serviceTypeId, periodKey])
//    prevents duplicate deliverables for the same period (returns HTTP 409 Conflict).
// ============================================================================

import prisma from '../config/prisma.js';
import engagementModel from '../models/engagement.model.js';
import serviceTypeModel from '../models/serviceType.model.js';
import taskTemplateModel from '../models/taskTemplate.model.js';
import taskModel from '../models/task.model.js';
import taskActivityModel from '../models/taskActivity.model.js';
import { AppError } from '../utils/errors.js';
import { computePeriodKey } from '../utils/periodKey.js';

export async function getEngagements(user, pagination = {}) {
  let where = {};

  if (user.role === 'manager') {
    where = {
      OR: [
        { managerId: user.id },
        { createdById: user.id }
      ]
    };
  } else if (user.role === 'team_member') {
    where = {
      tasks: {
        some: { assigneeId: user.id }
      }
    };
  }

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    engagementModel.findMany(where, { skip, take: limit }),
    engagementModel.count(where)
  ]);

  return { data, page, limit, total };
}

export async function getEngagementById(id, user) {
  const engagement = await engagementModel.findById(id);

  if (!engagement) {
    throw new AppError('Engagement not found', 404);
  }

  if (user.role === 'team_member') {
    const hasTask = engagement.tasks.some((t) => t.assigneeId === user.id);
    if (!hasTask) {
      throw new AppError('Forbidden: You do not have access to this engagement', 403);
    }
  }

  return engagement;
}

export async function getEngagementTasks(engagementId, user) {
  const engagement = await engagementModel.findById(engagementId);

  if (!engagement) {
    throw new AppError('Engagement not found', 404);
  }

  let where = { engagementId };
  if (user.role === 'team_member') {
    where.assigneeId = user.id;
  }

  return taskModel.findMany(where);
}

export async function createEngagement(input, user) {
  const service = await serviceTypeModel.findById(input.serviceTypeId, {
    include: {
      templates: {
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  if (!service) {
    throw new AppError('Service type not found', 404);
  }

  const startDate = new Date(input.periodStart);
  const endDate = new Date(input.periodEnd);
  const periodKey = computePeriodKey(startDate, service.recurrenceInterval);
  const managerId = input.managerId || (user.role === 'manager' ? user.id : null);

  try {
    const createdEngagement = await prisma.$transaction(async (tx) => {
      // 1. Create engagement
      const engagement = await engagementModel.create({
        clientId: input.clientId,
        serviceTypeId: input.serviceTypeId,
        title: input.title.trim(),
        description: input.description || null,
        periodStart: startDate,
        periodEnd: endDate,
        periodKey,
        status: 'active',
        managerId,
        isRecurring: service.isRecurring,
        createdById: user.id
      }, tx);

      // 2. Clone active templates into tasks
      const templates = service.templates || [];
      for (const template of templates) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + template.offsetDaysFromPeriodStart);

        const task = await taskModel.create({
          engagementId: engagement.id,
          templateId: template.id,
          title: template.title,
          description: template.description,
          reviewerId: template.requiresReview ? managerId : null,
          status: 'not_started',
          dueDate,
          createdById: user.id
        }, tx);

        // 3. Insert initial task_activity
        await taskActivityModel.create({
          taskId: task.id,
          actorId: user.id,
          action: 'engagement_created',
          comment: 'Task spawned from service template blueprint'
        }, tx);
      }

      return engagement;
    });

    return createdEngagement;
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError('Duplicate recurring engagement', 409);
    }
    throw err;
  }
}

export default {
  getEngagements,
  getEngagementById,
  getEngagementTasks,
  createEngagement
};
