// ============================================================================
// File: backend/tests/auth-and-users.test.js
// Description: Integration tests for authentication and user governance
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { testUsers, createAuthHeader } from './helpers.js';

vi.mock('../src/config/prisma.js', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findById: vi.fn(),
      update: vi.fn()
    },
    taskActivity: {
      create: vi.fn()
    },
    $transaction: vi.fn((cb) => cb(mockPrisma))
  };

  return {
    default: mockPrisma,
    prisma: mockPrisma
  };
});

import prisma from '../src/config/prisma.js';
import app from '../src/app.js';

describe('Auth and User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid login credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });

  it('allows admin to create a new user via POST /api/users', async () => {
    const uniqueEmail = `newuser_${Date.now()}@example.com`;
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-new-1',
      email: uniqueEmail,
      fullName: 'New Test User',
      role: 'team_member',
      isActive: true,
      createdAt: new Date()
    });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', createAuthHeader(testUsers.admin))
      .send({
        email: uniqueEmail,
        password: 'password123',
        fullName: 'New Test User',
        role: 'team_member'
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe(uniqueEmail);
    expect(res.body.data.fullName).toBe('New Test User');
    expect(res.body.data.role).toBe('team_member');
  });

  it('allows admin to create a new manager via POST /api/users', async () => {
    const uniqueEmail = `newmanager_${Date.now()}@example.com`;
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-new-mgr-1',
      email: uniqueEmail,
      fullName: 'New Test Manager',
      role: 'manager',
      isActive: true,
      createdAt: new Date()
    });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', createAuthHeader(testUsers.admin))
      .send({
        email: uniqueEmail,
        password: 'password123',
        fullName: 'New Test Manager',
        role: 'manager'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('manager');
  });

  it('allows admin to create a new admin via POST /api/users', async () => {
    const uniqueEmail = `newadmin_${Date.now()}@example.com`;
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-new-admin-1',
      email: uniqueEmail,
      fullName: 'New Test Admin',
      role: 'admin',
      isActive: true,
      createdAt: new Date()
    });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', createAuthHeader(testUsers.admin))
      .send({
        email: uniqueEmail,
        password: 'password123',
        fullName: 'New Test Admin',
        role: 'admin'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('admin');
  });

  it('prevents non-admins from creating a user via POST /api/users', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({
        email: `forbidden_${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Forbidden User',
        role: 'team_member'
      });

    expect(res.status).toBe(403);
  });

  it('prevents managers from creating a user via POST /api/users', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', createAuthHeader(testUsers.manager1))
      .send({
        email: `forbidden_mgr_${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Forbidden User',
        role: 'manager'
      });

    expect(res.status).toBe(403);
  });

  it('rejects public registration attempts to create admin role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `badadmin_${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Malicious Admin',
        role: 'admin'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Only administrators can create admin and manager accounts');
  });

  it('rejects public registration attempts to create manager role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `badmgr_${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Malicious Manager',
        role: 'manager'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Only administrators can create admin and manager accounts');
  });

  it('allows public registration for team_member', async () => {
    const uniqueEmail = `registered_${Date.now()}@example.com`;
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-registered-1',
      email: uniqueEmail,
      fullName: 'Self Registered',
      role: 'team_member',
      isActive: true,
      createdAt: new Date()
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'password123',
        fullName: 'Self Registered'
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.user.role).toBe('team_member');
  });

  it('allows admin to view all tasks via GET /api/tasks', async () => {
    prisma.task.findMany.mockResolvedValue([
      { id: 'task-1', title: 'File GSTR-3B' },
      { id: 'task-2', title: 'Collect client data' }
    ]);

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', createAuthHeader(testUsers.admin));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('allows manager/admin to set deadlines via PATCH /api/tasks/:id/assign', async () => {
    const taskId = '10000000-0000-4000-a000-000000000006';
    const newDueDate = '2026-10-15T00:00:00.000Z';

    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'File GSTR-3B',
      assigneeId: testUsers.member1.id,
      reviewerId: testUsers.manager1.id,
      dueDate: new Date('2026-09-15'),
      engagement: {
        id: 'eng-1',
        managerId: testUsers.manager1.id,
        createdById: testUsers.manager1.id
      }
    });

    prisma.task.update.mockResolvedValue({
      id: taskId,
      title: 'File GSTR-3B',
      assigneeId: testUsers.member1.id,
      reviewerId: testUsers.manager1.id,
      dueDate: new Date(newDueDate)
    });
    prisma.taskActivity.create.mockResolvedValue({ id: 'act-1' });

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', createAuthHeader(testUsers.admin))
      .send({
        dueDate: newDueDate
      });

    expect(res.status).toBe(200);
    expect(new Date(res.body.data.dueDate).toISOString()).toBe(newDueDate);
  });

  it('prevents team members from assigning or setting deadlines', async () => {
    const taskId = '10000000-0000-4000-a000-000000000006';
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'File GSTR-3B',
      assigneeId: testUsers.member1.id,
      reviewerId: testUsers.manager1.id,
      dueDate: new Date('2026-09-15'),
      engagement: {
        id: 'eng-1',
        managerId: testUsers.manager1.id,
        createdById: testUsers.manager1.id
      }
    });

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({
        dueDate: '2026-12-31T00:00:00.000Z'
      });

    expect(res.status).toBe(403);
  });
});
