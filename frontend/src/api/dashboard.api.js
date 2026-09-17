// ============================================================================
// File: frontend/src/api/dashboard.api.js
// Description: Operational dashboard KPI counts API call
// ============================================================================

import api from './client.js';

export async function getDashboardCounts() {
  return api.get('/api/dashboard');
}

export default {
  getDashboardCounts
};
