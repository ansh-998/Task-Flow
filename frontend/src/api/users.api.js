// ============================================================================
// File: frontend/src/api/users.api.js
// Description: User directory & role governance API calls
// ============================================================================

import api from './client.js';

export async function getUsers() {
  return api.get('/api/users');
}

export async function createUser(data) {
  return api.post('/api/users', data);
}

export async function updateRole(id, role) {
  return api.patch(`/api/users/${id}/role`, { role });
}

export async function updateActive(id, isActive) {
  return api.patch(`/api/users/${id}/active`, { isActive });
}

export default {
  getUsers,
  createUser,
  updateRole,
  updateActive
};
