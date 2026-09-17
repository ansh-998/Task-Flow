// ============================================================================
// File: frontend/src/api/clients.api.js
// Description: Client directory API calls
// ============================================================================

import api from './client.js';

export async function getClients() {
  return api.get('/api/clients');
}

export async function createClient(data) {
  return api.post('/api/clients', data);
}

export async function updateClient(id, data) {
  return api.patch(`/api/clients/${id}`, data);
}

export default {
  getClients,
  createClient,
  updateClient
};
