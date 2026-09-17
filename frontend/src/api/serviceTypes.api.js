// ============================================================================
// File: frontend/src/api/serviceTypes.api.js
// Description: Service Types catalog API calls
// ============================================================================

import api from './client.js';

export async function getServiceTypes() {
  return api.get('/api/service-types');
}

export async function createServiceType(data) {
  return api.post('/api/service-types', data);
}

export async function updateServiceType(id, data) {
  return api.patch(`/api/service-types/${id}`, data);
}

export default {
  getServiceTypes,
  createServiceType,
  updateServiceType
};
