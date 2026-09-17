// ============================================================================
// File: backend/tests/self-approval.test.js
// Description: Rule 5 - Assignee cannot approve own work in ready_for_review -> 403
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
      $transaction: vi.fn()
    },
    prisma: {
      task: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      taskActivity: {
        create: vi.fn()
      },
      $transaction: vi.fn()
    }
  };
});

import prisma from '../src/config/prisma.js';
import app from '../src/app.js';

describe('Workflow Rule 5: Anti-Self-Approval Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with 403 when an assignee attempts to approve their own task in ready_for_review', async () => {
    const taskId = '10000000-0000-4000-a000-000000000003';

    // Mock task in ready_for_review state, assigned to Member 1
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'Annual Corporate Tax Return',
      status: 'ready_for_review',
      assigneeId: testUsers.member1.id,
      reviewerId: testUsers.manager1.id,
      engagement: {
        id: 'eng-1',
        managerId: testUsers.manager1.id,
        createdById: testUsers.manager1.id
      }
    });

    // Assignee (Member 1) attempts to submit a review approving their own work
    const res = await request(app)
      .post(`/api/tasks/${taskId}/review`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({
        decision: 'approve',
        comment: 'I approve my own calculations'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Cannot approve own work/i);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('rejects with 403 even if the user is a Manager who is the assigned worker on the task', async () => {
    const taskId = '10000000-0000-4000-a000-000000000004';

    // Even a manager who is assigned to the task cannot approve their own work
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'Complex Corporate Audit',
      status: 'ready_for_review',
      assigneeId: testUsers.manager1.id,
      reviewerId: testUsers.admin.id,
      engagement: {
        id: 'eng-1',
        managerId: testUsers.manager1.id,
        createdById: testUsers.admin.id
      }
    });

    const res = await request(app)
      .post(`/api/tasks/${taskId}/review`)
      .set('Authorization', createAuthHeader(testUsers.manager1))
      .send({
        decision: 'approve',
        comment: 'Manager approving self'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Cannot approve own work/i);
  });
});
