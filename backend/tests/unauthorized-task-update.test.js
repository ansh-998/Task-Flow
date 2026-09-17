// ============================================================================
// File: backend/tests/unauthorized-task-update.test.js
// Description: Rule 1 - Member A attempts to PATCH Member B's task -> 403 Forbidden
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { testUsers, createAuthHeader } from './helpers.js';

// Mock prisma before importing app
vi.mock('../src/config/prisma.js', () => {
  return {
    default: {
      task: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      taskActivity: {
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb({
        task: { update: vi.fn() },
        taskActivity: { create: vi.fn() }
      }))
    },
    prisma: {
      task: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      taskActivity: {
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb({
        task: { update: vi.fn() },
        taskActivity: { create: vi.fn() }
      }))
    }
  };
});

import prisma from '../src/config/prisma.js';
import app from '../src/app.js';

describe('Workflow Rule 1: Unauthorized Task Modification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with 403 when Team Member A attempts to update status of a task assigned to Team Member B', async () => {
    const taskId = '10000000-0000-4000-a000-000000000002';

    // Mock task belonging to Member 2, in engagement managed by Manager 1
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'Prepare Tax Workpapers',
      status: 'not_started',
      assigneeId: testUsers.member2.id,
      reviewerId: testUsers.manager1.id,
      engagement: {
        id: 'eng-1',
        managerId: testUsers.manager1.id,
        createdById: testUsers.manager1.id,
      }
    });

    // Member 1 attempts to PATCH Member 2's task
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({
        status: 'in_progress',
        comment: 'I am not the assignee'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden: Not authorized to modify this task/i);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
