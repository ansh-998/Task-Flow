// ============================================================================
// File: backend/tests/invalid-transition.test.js
// Description: Rule 3 - Illegal status jump (not_started -> completed) returns 400
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

describe('Workflow Rule 3: Enforce Valid Workflow State Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with 400 when attempting an illegal transition directly from not_started to completed', async () => {
    const taskId = '10000000-0000-4000-a000-000000000001';

    // Mock task in not_started state assigned to Member 1
    prisma.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'Prepare Trial Balance',
      status: 'not_started',
      assigneeId: testUsers.member1.id,
      reviewerId: testUsers.manager1.id,
      engagement: {
        id: 'eng-1',
        managerId: testUsers.manager1.id,
        createdById: testUsers.manager1.id
      }
    });

    // Assignee attempts to jump from not_started directly to completed
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({
        status: 'completed',
        comment: 'Jumping straight to done'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid workflow transition/i);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
