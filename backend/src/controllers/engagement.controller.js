// ============================================================================
// File: backend/src/controllers/engagement.controller.js
// Description: Thin HTTP controller for engagement lifecycle
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import engagementService from '../services/engagement.service.js';
import { generateNextPeriod } from '../services/recurring.service.js';

export const getEngagements = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await engagementService.getEngagements(req.user, { page, limit });
  res.status(200).json(result);
});

export const getEngagementById = asyncHandler(async (req, res) => {
  const engagement = await engagementService.getEngagementById(req.params.id, req.user);
  res.status(200).json({ data: engagement });
});

export const getEngagementTasks = asyncHandler(async (req, res) => {
  const tasks = await engagementService.getEngagementTasks(req.params.id, req.user);
  res.status(200).json({ data: tasks });
});

export const createEngagement = asyncHandler(async (req, res) => {
  const engagement = await engagementService.createEngagement(req.body, req.user);
  res.status(201).json({ data: engagement });
});

export const triggerRecurringGeneration = asyncHandler(async (req, res) => {
  const summary = await generateNextPeriod();
  res.status(200).json({ data: summary });
});

export default {
  getEngagements,
  getEngagementById,
  getEngagementTasks,
  createEngagement,
  triggerRecurringGeneration
};
