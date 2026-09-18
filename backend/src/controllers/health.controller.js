// ============================================================================
// File: backend/src/controllers/health.controller.js
// Description: Controller for API health checks
// ============================================================================

import prisma from '../config/prisma.js';

export const getHealth = (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
};

export const getDetailedHealth = async (req, res) => {
  let dbStatus = 'connected';
  let userCount = null;
  let dbError = null;

  try {
    userCount = await prisma.user.count();
  } catch (err) {
    dbStatus = 'disconnected';
    dbError = err.message;
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      userCount,
      error: dbError
    }
  });
};

export default {
  getHealth,
  getDetailedHealth
};
