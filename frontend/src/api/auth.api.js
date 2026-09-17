// ============================================================================
// File: frontend/src/api/auth.api.js
// Description: Authentication resource API calls
// ============================================================================

import api from './client.js';

export async function login(email, password) {
  return api.post('/api/auth/login', { email, password });
}

export async function register(data) {
  return api.post('/api/auth/register', data);
}

export async function getMe() {
  return api.get('/api/auth/me');
}

export default {
  login,
  register,
  getMe
};
