// ============================================================================
// File: backend/src/services/task.service.js
// Description: Task workflow engine, state transition enforcement, and review rules
//
// LEARNING NOTES — HOW THE WORKFLOW ENGINE WORKS:
// 1. STATE MACHINE: Tasks move through strict states (not_started -> in_progress ->
//    waiting_for_client / ready_for_review -> completed / changes_requested).
//    Transitions are validated against the ALLOWED_TRANSITIONS map.
// 2. ANTI-SELF-APPROVAL: A user who is the assignee cannot approve their own work.
//    Attempting to do so returns HTTP 403 Forbidden.
// 3. ATOMIC AUDIT LOG: Every status change or assignment creates a TaskActivity
//    record inside a single prisma.$transaction so the history is 100% reliable.
// ============================================================================

import prisma from '../config/prisma.js';
import taskModel from '../models/task.model.js';
import taskActivityModel from '../models/taskActivity.model.js';
import { AppError } from '../utils/errors.js';

/**
 * Valid directed graph transitions for tasks
 */
const ALLOWED_TRANSITIONS = {
  not_started: ['in_progress', 'cancelled'],
  in_progress: ['waiting_for_client', 'ready_for_review', 'cancelled'],
  waiting_for_client: ['in_progress', 'cancelled'],
  ready_for_review: ['changes_requested', 'completed'],
  changes_requested: ['in_progress', 'cancelled'],
  completed: [],
  cancelled: []
};

/**
 * List tasks accessible to the requesting user based on their role:
 * - Admin: sees all tasks
 * - Manager: sees tasks in engagements they manage or created
 * - Team Member: sees tasks assigned to them
 */
export async function getTasks(user, pagination = {}) {
  let where = {};
  if (user.role === 'manager') {
    where = {
      engagement: {
        OR: [
          { managerId: user.id },
          { createdById: user.id }
        ]
      }
    };
  } else if (user.role === 'team_member') {
    where = { assigneeId: user.id };
  }

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    taskModel.findMany(where, { skip, take: limit }),
    taskModel.count(where)
  ]);

  return { data, page, limit, total };
}

/**
 * List tasks where user is assignee OR designated reviewer
 */
export async function getMyTasks(userId, pagination = {}) {
  const where = {
    OR: [
      { assigneeId: userId },
      { reviewerId: userId }
    ]
  };

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    taskModel.findMany(where, { skip, take: limit }),
    taskModel.count(where)
  ]);

  return { data, page, limit, total };
}

/**
 * Get a single task by ID with full engagement and assignment details
 */
export async function getTaskById(taskId, user) {
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return task;
}

/**
 * Assign or reassign a task and/or set its deadline
 * - Rule: Reviewer cannot be the assignee
 * - Permission: Admin or Engagement Manager only
 */
export async function assignTask(taskId, { assigneeId, reviewerId, dueDate }, user) {
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Authorization check
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager' && (
    task.engagement?.managerId === user.id ||
    task.engagement?.createdById === user.id
  );
  if (!isAdmin && !isManager) {
    throw new AppError('Forbidden: Only administrators or engagement managers can assign tasks or set deadlines', 403);
  }

  const effectiveAssignee = assigneeId !== undefined ? (assigneeId || null) : task.assigneeId;
  const effectiveReviewer = reviewerId !== undefined ? (reviewerId || null) : task.reviewerId;

  // Invariant: Reviewer cannot be the assignee
  if (effectiveReviewer && effectiveAssignee && effectiveReviewer === effectiveAssignee) {
    throw new AppError('Reviewer cannot be the assignee', 400);
  }

  const updatePayload = {
    assigneeId: effectiveAssignee,
    reviewerId: effectiveReviewer
  };

  if (dueDate !== undefined) {
    updatePayload.dueDate = dueDate ? new Date(dueDate) : null;
  }

  // Execute task update + audit log entry atomically
  return prisma.$transaction(async (tx) => {
    const updatedTask = await taskModel.update(taskId, updatePayload, tx);

    await taskActivityModel.create({
      taskId,
      actorId: user.id,
      action: 'assigned',
      comment: dueDate !== undefined && (assigneeId === undefined && reviewerId === undefined)
        ? 'Task deadline updated'
        : 'Task assignment and deadline updated',
      metadata: {
        assigneeId: effectiveAssignee,
        reviewerId: effectiveReviewer,
        dueDate: updatePayload.dueDate
      }
    }, tx);

    return updatedTask;
  });
}

/**
 * Transition a task to a new status
 * Enforces:
 * 1. Ownership / role permissions (403 on cross-user modification)
 * 2. Allowed state transitions (400 on invalid state jump)
 * 3. Review approval separation (team members cannot self-complete)
 */
export async function updateTaskStatus(taskId, { status: newStatus, comment }, user) {
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const isAdmin = user.role === 'admin';
  const isEngManager = user.role === 'manager' && (
    task.engagement?.managerId === user.id ||
    task.engagement?.createdById === user.id
  );
  const isAssignee = task.assigneeId === user.id;
  const isReviewer = task.reviewerId === user.id;

  // 1. Permission check: Only Admin, Engagement Manager, or Assignee can modify
  if (!isAdmin && !isEngManager && !isAssignee) {
    throw new AppError('Forbidden: Not authorized to modify this task', 403);
  }

  // 2. State Machine check: Ensure transition is legally valid
  const allowed = ALLOWED_TRANSITIONS[task.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError('Invalid workflow transition', 400);
  }

  // 3. Team Member restriction: Cannot directly complete, reject, or cancel
  if (user.role === 'team_member' && ['completed', 'changes_requested', 'cancelled'].includes(newStatus)) {
    throw new AppError('Invalid workflow transition', 400);
  }

  // 4. Tasks in ready_for_review can only be moved by Reviewer, Manager, or Admin
  if (task.status === 'ready_for_review' && !isAdmin && !isEngManager && !isReviewer) {
    throw new AppError('Invalid workflow transition', 400);
  }

  const now = new Date();
  const startedAt = !task.startedAt && newStatus === 'in_progress' ? now : task.startedAt;
  const completedAt = newStatus === 'completed' ? now : null;

  // Execute update + audit log atomically
  return prisma.$transaction(async (tx) => {
    const updatedTask = await taskModel.update(taskId, {
      status: newStatus,
      startedAt,
      completedAt
    }, tx);

    await taskActivityModel.create({
      taskId,
      actorId: user.id,
      fromStatus: task.status,
      toStatus: newStatus,
      action: 'status_change',
      comment: comment || null
    }, tx);

    return updatedTask;
  });
}

/**
 * Review a task that is in 'ready_for_review'
 * - Decision: 'approve' -> status becomes 'completed'
 * - Decision: 'request_changes' -> status becomes 'changes_requested'
 * - ANTI-SELF-APPROVAL RULE: If caller.id === task.assigneeId, return 403 Forbidden!
 */
export async function reviewTask(taskId, { decision, comment }, user) {
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (task.status !== 'ready_for_review') {
    throw new AppError('Task is not ready for review', 400);
  }

  // CRITICAL INVARIANT: Assignee cannot approve their own work!
  if (user.id === task.assigneeId) {
    throw new AppError('Cannot approve own work', 403);
  }

  // Caller must be designated reviewer, engagement manager, or admin
  const isAdmin = user.role === 'admin';
  const isEngManager = user.role === 'manager' && (
    task.engagement?.managerId === user.id ||
    task.engagement?.createdById === user.id
  );
  const isReviewer = task.reviewerId === user.id;

  if (!isAdmin && !isEngManager && !isReviewer) {
    throw new AppError('Forbidden: You are not authorized to review this task', 403);
  }

  const newStatus = decision === 'approve' ? 'completed' : 'changes_requested';
  const now = new Date();
  const completedAt = decision === 'approve' ? now : null;

  // Save review outcome and write to audit trail
  return prisma.$transaction(async (tx) => {
    const updatedTask = await taskModel.update(taskId, {
      status: newStatus,
      completedAt
    }, tx);

    await taskActivityModel.create({
      taskId,
      actorId: user.id,
      fromStatus: 'ready_for_review',
      toStatus: newStatus,
      action: 'review',
      comment: comment || null,
      metadata: { decision }
    }, tx);

    return updatedTask;
  });
}

/**
 * Retrieve immutable audit history for a task
 */
export async function getTaskActivity(taskId, user) {
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const isAdmin = user.role === 'admin';
  const isEngManager = user.role === 'manager' && (
    task.engagement?.managerId === user.id ||
    task.engagement?.createdById === user.id
  );
  const isAssignee = task.assigneeId === user.id;
  const isReviewer = task.reviewerId === user.id;

  if (!isAdmin && !isEngManager && !isAssignee && !isReviewer) {
    throw new AppError('Forbidden: Not authorized', 403);
  }

  return taskActivityModel.findManyByTaskId(taskId);
}

export default {
  getTasks,
  getMyTasks,
  getTaskById,
  assignTask,
  updateTaskStatus,
  reviewTask,
  getTaskActivity
};
