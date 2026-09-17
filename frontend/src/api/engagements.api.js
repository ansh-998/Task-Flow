// ============================================================================
// File: frontend/src/api/engagements.api.js
// Description: Engagement lifecycle API calls
// ============================================================================

import api from './client.js';

export async function getEngagements() {
  return api.get('/api/engagements');
}

export async function getEngagementById(id) {
  return api.get(`/api/engagements/${id}`);
}

export async function getEngagementTasks(id) {
  return api.get(`/api/engagements/${id}/tasks`);
}

export async function createEngagement(data) {
  return api.post('/api/engagements', data);
}

export async function triggerRecurringGeneration() {
  return api.post('/api/engagements/generate-recurring');
}

export default {
  getEngagements,
  getEngagementById,
  getEngagementTasks,
  createEngagement,
  triggerRecurringGeneration
};
