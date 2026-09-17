// ============================================================================
// File: backend/src/controllers/dashboard.controller.js
// Description: Thin HTTP controller for dashboard KPI metrics
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import dashboardService from '../services/dashboard.service.js';

export const getCounts = asyncHandler(async (req, res) => {
  const counts = await dashboardService.getDashboardCounts(req.user);
  res.status(200).json({ data: counts });
});

export default {
  getCounts
};
