// ============================================================================
// File: backend/src/controllers/health.controller.js
// Description: Controller for API health checks
// ============================================================================

export const getHealth = (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
};

export default {
  getHealth
};
