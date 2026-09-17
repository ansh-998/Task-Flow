// ============================================================================
// File: backend/src/services/dashboard.service.js
// Description: KPI metrics calculation scoped by user role
// ============================================================================

import taskModel from '../models/task.model.js';

export async function getDashboardCounts(user) {
  let baseWhere = {};

  if (user.role === 'manager') {
    baseWhere = {
      engagement: {
        OR: [
          { managerId: user.id },
          { createdById: user.id }
        ]
      }
    };
  } else if (user.role === 'team_member') {
    baseWhere = {
      assigneeId: user.id
    };
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  const [open, overdue, due_today, waiting_for_client, waiting_for_review] = await Promise.all([
    // Open: Active tasks not completed and not cancelled
    taskModel.count({
      ...baseWhere,
      status: { notIn: ['completed', 'cancelled'] }
    }),
    // Overdue: Open tasks past due date
    taskModel.count({
      ...baseWhere,
      status: { notIn: ['completed', 'cancelled'] },
      dueDate: { lt: todayStart }
    }),
    // Due Today
    taskModel.count({
      ...baseWhere,
      status: { notIn: ['completed', 'cancelled'] },
      dueDate: { gte: todayStart, lte: todayEnd }
    }),
    // Waiting for Client
    taskModel.count({
      ...baseWhere,
      status: 'waiting_for_client'
    }),
    // Waiting for Review (ready_for_review)
    taskModel.count({
      ...baseWhere,
      status: 'ready_for_review'
    })
  ]);

  return {
    open,
    overdue,
    due_today,
    waiting_for_client,
    waiting_for_review
  };
}

export default {
  getDashboardCounts
};
