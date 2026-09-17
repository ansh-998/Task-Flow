// ============================================================================
// File: backend/src/controllers/auth.controller.js
// Description: Thin HTTP controller for authentication
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import authService from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ user });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ user });
});

export default {
  login,
  register,
  getMe
};
