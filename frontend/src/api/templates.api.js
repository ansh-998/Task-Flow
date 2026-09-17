// ============================================================================
// File: frontend/src/api/templates.api.js
// Description: Task blueprint templates API calls
// ============================================================================

import api from './client.js';

export async function getTemplates(serviceTypeId) {
  return api.get(`/api/service-types/${serviceTypeId}/templates`);
}

export async function createTemplate(serviceTypeId, data) {
  return api.post(`/api/service-types/${serviceTypeId}/templates`, data);
}

export async function updateTemplate(id, data) {
  return api.patch(`/api/templates/${id}`, data);
}

export default {
  getTemplates,
  createTemplate,
  updateTemplate
};
