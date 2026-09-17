// ============================================================================
// File: frontend/src/api/tasks.api.js
// Description: Tasks governance, assignments, transitions, and reviews API calls
// ============================================================================

import api from './client.js';

export async function getTasks() {
  return api.get('/api/tasks');
}

export async function getMyTasks() {
  return api.get('/api/tasks/my');
}

export async function getTaskById(id) {
  return api.get(`/api/tasks/${id}`);
}

export async function assignTask(id, data) {
  return api.patch(`/api/tasks/${id}/assign`, data);
}

export async function updateStatus(id, data) {
  return api.patch(`/api/tasks/${id}/status`, data);
}

export async function reviewTask(id, data) {
  return api.post(`/api/tasks/${id}/review`, data);
}

export async function getTaskActivity(id) {
  return api.get(`/api/tasks/${id}/activity`);
}

export default {
  getTasks,
  getMyTasks,
  getTaskById,
  assignTask,
  updateStatus,
  reviewTask,
  getTaskActivity
};
