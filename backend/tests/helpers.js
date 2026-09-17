// ============================================================================
// File: backend/tests/helpers.js
// Description: Test user fixtures, JWT auth generators, and test helpers
// ============================================================================

import jwt from 'jsonwebtoken';
import './setup.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-taskflow-2026-production';

export const testUsers = {
  admin: {
    id: '00000000-0000-4000-a000-000000000001',
    email: 'admin@taskflow.dev',
    fullName: 'System Administrator',
    role: 'admin',
    isActive: true
  },
  manager1: {
    id: '00000000-0000-4000-a000-000000000002',
    email: 'sarah.manager@taskflow.dev',
    fullName: 'Sarah Jenkins (Manager)',
    role: 'manager',
    isActive: true
  },
  member1: {
    id: '00000000-0000-4000-a000-000000000003',
    email: 'alice.member@taskflow.dev',
    fullName: 'Alice Walker (Member)',
    role: 'team_member',
    isActive: true
  },
  member2: {
    id: '00000000-0000-4000-a000-000000000004',
    email: 'bob.member@taskflow.dev',
    fullName: 'Bob Davis (Member)',
    role: 'team_member',
    isActive: true
  }
};

export function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

export function createAuthHeader(user) {
  return `Bearer ${createToken(user)}`;
}

export default {
  testUsers,
  createToken,
  createAuthHeader
};
