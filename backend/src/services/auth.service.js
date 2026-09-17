// ============================================================================
// File: backend/src/services/auth.service.js
// Description: Authentication domain logic, token signing & verification
// ============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import { AppError } from '../utils/errors.js';
import env from '../config/env.js';

export async function login({ email, password }) {
  const user = await userModel.findByEmail(email);

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  };
}

export async function register({ email, password, fullName, role }) {
  if (role && role !== 'team_member') {
    throw new AppError('Only administrators can create admin and manager accounts', 403);
  }

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
    role: 'team_member'
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

export async function getMe(userId) {
  const user = await userModel.findById(userId, {
    id: true,
    email: true,
    fullName: true,
    role: true,
    isActive: true,
    createdAt: true
  });

  if (!user || !user.isActive) {
    throw new AppError('User not found or disabled', 404);
  }

  return user;
}

export default {
  login,
  register,
  getMe
};
