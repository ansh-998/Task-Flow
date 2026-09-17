// ============================================================================
// File: backend/tests/manager-approval.test.js
// Description: Rule 4 - Manager or Reviewer approves ready_for_review task -> completed
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { testUsers, createAuthHeader } from './helpers.js';

vi.mock('../src/config/prisma.js', () => {
  return {
    default: {
      task: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      taskActivity: {
        create: vi.fn()
      },
      $transaction: vi.fn((cb) => cb({
        task: {
          update: vi.fn().mockImplementation(({ data }) => ({
            id: 'task-ready-for-review-1',
            title: 'Q1 Financial Statements',
            status: data.status,
            completedAt: data.completedAt,
            assignee: { id: testUsers.member1.id, fullName: testUsers.member1.fullName, email: testUsers.member1.email },
            reviewer: { id: testUsers.manager1.id, fullName: testUsers.manager1.fullName, email: testUsers.manager1.email }
          }))
        },
        taskActivity: {
          create: vi.fn().mockResolvedValue({ id: 'act-1' })
        }
      }))
    },
    prisma: {
      task: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      taskActivity: {
        create: vi.fn()
      },
      $transaction: vi.fn((cb) => cb({
        task: {
          update: vi.fn().mockImplementation(({ data }) => ({
            id: 'task-ready-for-review-1',
            title: 'Q1 Financial Statements',
            status: data.status,
            completedAt: data.completedAt,
            assignee: { id: testUsers.member1.id, fullName: testUsers.member1.fullName, email: testUsers.member1.email },
            reviewer: { id: testUsers.manager1.id, fullName: testUsers.manager1.fullName, email: testUsers.manager1.email }
          }))
        },
        taskActivity: {
          create: vi.fn().mockResolvedValue({ id: 'act-1' })
        }
      }))
    }
  };
});

import prisma from '../src/config/prisma.js';
import app from '../src/app.js';

describe('Workflow Rule 4: Manager / Reviewer Approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully transitions task from ready_for_review to completed when reviewer approves', async () => {
    const taskId = '10000000-0000-4000-a000-000000000005';

    // Mock task in ready_for_review state, assigned to Member 1, reviewer is Manager 1
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'Q1 Financial Statements',
      status: 'ready_for_review',
      assigneeId: testUsers.member1.id,
      reviewerId: testUsers.manager1.id,
      engagement: {
        id: 'eng-1',
        managerId: testUsers.manager1.id,
        createdById: testUsers.manager1.id
      }
    });

    // Manager 1 (designated reviewer) calls review endpoint with 'approve'
    const res = await request(app)
      .post(`/api/tasks/${taskId}/review`)
      .set('Authorization', createAuthHeader(testUsers.manager1))
      .send({
        decision: 'approve',
        comment: 'All calculations verified and approved.'
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completedAt).toBeDefined();
  });
});
