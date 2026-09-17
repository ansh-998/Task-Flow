// ============================================================================
// File: backend/src/controllers/task.controller.js
// Description: Thin HTTP controller for task governance and workflow actions
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import taskService from '../services/task.service.js';

export const getTasks = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await taskService.getTasks(req.user, { page, limit });
  res.status(200).json(result);
});

export const getMyTasks = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await taskService.getMyTasks(req.user.id, { page, limit });
  res.status(200).json(result);
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id, req.user);
  res.status(200).json({ data: task });
});

export const assignTask = asyncHandler(async (req, res) => {
  const updated = await taskService.assignTask(req.params.id, req.body, req.user);
  res.status(200).json({ data: updated });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const updated = await taskService.updateTaskStatus(req.params.id, req.body, req.user);
  res.status(200).json({ data: updated });
});

export const reviewTask = asyncHandler(async (req, res) => {
  const updated = await taskService.reviewTask(req.params.id, req.body, req.user);
  res.status(200).json({ data: updated });
});

export const getTaskActivity = asyncHandler(async (req, res) => {
  const activity = await taskService.getTaskActivity(req.params.id, req.user);
  res.status(200).json({ data: activity });
});

export default {
  getTasks,
  getMyTasks,
  getTaskById,
  assignTask,
  updateTaskStatus,
  reviewTask,
  getTaskActivity
};
