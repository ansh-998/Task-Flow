// ============================================================================
// File: backend/src/services/user.service.js
// Description: User directory, role management, and access state logic
// ============================================================================

import bcrypt from 'bcryptjs';
import userModel from '../models/user.model.js';
import { AppError } from '../utils/errors.js';

export async function getUsers(pagination = {}) {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    userModel.findMany({}, { skip, take: limit }),
    userModel.count()
  ]);

  return { data, page, limit, total };
}

export async function createUser({ email, password, fullName, role }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw new AppError('User with this email already exists', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await userModel.create({
    email,
    passwordHash,
    fullName: fullName || email.split('@')[0],
    role: role || 'team_member'
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

export async function updateUserRole(id, role) {
  const user = await userModel.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return userModel.update(id, { role });
}

export async function updateUserActive(id, isActive) {
  const user = await userModel.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return userModel.update(id, { isActive });
}

export default {
  getUsers,
  createUser,
  updateUserRole,
  updateUserActive
};
