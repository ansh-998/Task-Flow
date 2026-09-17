// ============================================================================
// File: backend/src/controllers/user.controller.js
// Description: Thin HTTP controller for user administration
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import userService from '../services/user.service.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await userService.getUsers({ page, limit });
  res.status(200).json(result);
});

export const createUser = asyncHandler(async (req, res) => {
  const created = await userService.createUser(req.body);
  res.status(201).json({ data: created });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const updated = await userService.updateUserRole(req.params.id, req.body.role);
  res.status(200).json({ data: updated });
});

export const updateUserActive = asyncHandler(async (req, res) => {
  const updated = await userService.updateUserActive(req.params.id, req.body.isActive);
  res.status(200).json({ data: updated });
});

export default {
  getUsers,
  createUser,
  updateUserRole,
  updateUserActive
};
