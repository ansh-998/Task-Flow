// ============================================================================
// File: backend/src/controllers/internal.controller.js
// Description: Controller for internal cron automation triggers
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import { generateNextPeriod } from '../services/recurring.service.js';
import { AppError } from '../utils/errors.js';
import env from '../config/env.js';

export const runRecurring = asyncHandler(async (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== env.INTERNAL_SECRET) {
    return next(new AppError('Forbidden: Invalid internal secret', 403));
  }

  const result = await generateNextPeriod();
  res.status(200).json({ status: 'completed', result });
});

export default {
  runRecurring
};
