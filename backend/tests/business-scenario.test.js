// ============================================================================
// File: backend/tests/business-scenario.test.js
// Description: Business Scenario verification:
//   - Recurring (Monthly GST Compliance) & One-time (GST Registration or Refund)
//   - Multiple tasks assigned to team members and reviewed by managers
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { testUsers, createAuthHeader } from './helpers.js';

vi.mock('../src/config/prisma.js', () => {
  const mockPrisma = {
    serviceType: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    engagement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
    },
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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

describe('Business Scenario: Services Team Client & Engagement Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies recurring engagement creation and template task spawning (Monthly GST Compliance)', async () => {
    const serviceType = {
      id: '40000000-0000-4000-a000-000000000001',
      name: 'Monthly GST Compliance',
      code: 'GST-MONTHLY',
      isRecurring: true,
      recurrenceInterval: 'monthly',
      templates: [
        {
          id: 'tmpl-1',
          title: 'Collect client data',
          description: 'Request purchase invoices and bank ledger records',
          offsetDaysFromPeriodStart: 2,
          requiresReview: true
        },
        {
          id: 'tmpl-2',
          title: 'File GSTR-3B',
          description: 'Reconcile 2B credit, calculate liability, submit return',
          offsetDaysFromPeriodStart: 15,
          requiresReview: true
        }
      ]
    };

    prisma.serviceType.findUnique.mockResolvedValue(serviceType);

    const clientId = '50000000-0000-4000-a000-000000000001';
    const createdEng = {
      id: '60000000-0000-4000-a000-000000000001',
      clientId,
      serviceTypeId: serviceType.id,
      title: 'Acme Traders - Monthly GST Compliance',
      isRecurring: true,
      periodKey: '2026-09',
      managerId: testUsers.manager1.id,
      status: 'active'
    };

    prisma.engagement.create.mockResolvedValue(createdEng);
    prisma.task.create.mockImplementation(({ data }) => ({
      id: `task-${Date.now()}-${Math.random()}`,
      ...data,
      assignee: null,
      reviewer: { id: testUsers.manager1.id, fullName: testUsers.manager1.fullName }
    }));
    prisma.taskActivity.create.mockResolvedValue({ id: 'act-1' });

    // Manager creates recurring engagement
    const res = await request(app)
      .post('/api/engagements')
      .set('Authorization', createAuthHeader(testUsers.manager1))
      .send({
        clientId,
        serviceTypeId: serviceType.id,
        title: 'Acme Traders - Monthly GST Compliance',
        periodStart: '2026-09-01T00:00:00.000Z',
        periodEnd: '2026-09-30T23:59:59.000Z'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isRecurring).toBe(true);
    expect(res.body.data.periodKey).toBe('2026-09');
    expect(prisma.task.create).toHaveBeenCalledTimes(2);
    expect(prisma.taskActivity.create).toHaveBeenCalledTimes(2);
  });

  it('verifies one-time engagement creation (GST Registration / GST Refund)', async () => {
    const serviceType = {
      id: '40000000-0000-4000-a000-000000000002',
      name: 'GST Registration',
      code: 'GST-REG',
      isRecurring: false,
      recurrenceInterval: null,
      templates: [
        {
          id: 'tmpl-reg-1',
          title: 'Draft and file REG-01 application',
          description: 'Collect rental agreement, KYC, and upload on portal',
          offsetDaysFromPeriodStart: 5,
          requiresReview: true
        }
      ]
    };

    prisma.serviceType.findUnique.mockResolvedValue(serviceType);

    const clientId = '50000000-0000-4000-a000-000000000002';
    const createdEng = {
      id: '60000000-0000-4000-a000-000000000002',
      clientId,
      serviceTypeId: serviceType.id,
      title: 'Apex Logistics - Branch GST Registration',
      isRecurring: false,
      periodKey: '2026-09',
      managerId: testUsers.manager1.id,
      status: 'active'
    };

    prisma.engagement.create.mockResolvedValue(createdEng);
    prisma.task.create.mockImplementation(({ data }) => ({
      id: 'task-reg-1',
      ...data
    }));
    prisma.taskActivity.create.mockResolvedValue({ id: 'act-reg-1' });

    const res = await request(app)
      .post('/api/engagements')
      .set('Authorization', createAuthHeader(testUsers.manager1))
      .send({
        clientId,
        serviceTypeId: serviceType.id,
        title: 'Apex Logistics - Branch GST Registration',
        periodStart: '2026-09-01T00:00:00.000Z',
        periodEnd: '2026-09-30T23:59:59.000Z'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isRecurring).toBe(false);
    expect(prisma.task.create).toHaveBeenCalledTimes(1);
  });

  it('verifies full task lifecycle: assigned to team member, waiting on client, submitted for review, and reviewed by manager', async () => {
    const taskId = '10000000-0000-4000-a000-000000000007';
    let currentTask = {
      id: taskId,
      title: 'Draft and file REG-01 application',
      status: 'not_started',
      assigneeId: testUsers.member1.id,
      reviewerId: testUsers.manager1.id,
      dueDate: new Date('2026-09-15'),
      engagement: {
        id: '60000000-0000-4000-a000-000000000003',
        managerId: testUsers.manager1.id,
        createdById: testUsers.manager1.id
      }
    };

    prisma.task.findUnique.mockImplementation(() => Promise.resolve({ ...currentTask }));
    prisma.task.update.mockImplementation(({ data }) => {
      currentTask = { ...currentTask, ...data };
      return Promise.resolve({ ...currentTask });
    });
    prisma.taskActivity.create.mockResolvedValue({ id: 'act-flow' });

    // 1. Team member starts work: not_started -> in_progress
    const startRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({ status: 'in_progress', comment: 'Gathered initial documents' });

    expect(startRes.status).toBe(200);
    expect(currentTask.status).toBe('in_progress');

    // 2. Team member marks as waiting on client: in_progress -> waiting_for_client
    const waitRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({ status: 'waiting_for_client', comment: 'Awaiting electricity bill' });

    expect(waitRes.status).toBe(200);
    expect(currentTask.status).toBe('waiting_for_client');

    // 3. Team member resumes work: waiting_for_client -> in_progress
    const resumeRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({ status: 'in_progress', comment: 'Electricity bill received' });

    expect(resumeRes.status).toBe(200);
    expect(currentTask.status).toBe('in_progress');

    // 4. Team member submits for review: in_progress -> ready_for_review
    const submitRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', createAuthHeader(testUsers.member1))
      .send({ status: 'ready_for_review', comment: 'Completed draft application' });

    expect(submitRes.status).toBe(200);
    expect(currentTask.status).toBe('ready_for_review');

    // 5. Manager reviews and approves: ready_for_review -> completed
    const reviewRes = await request(app)
      .post(`/api/tasks/${taskId}/review`)
      .set('Authorization', createAuthHeader(testUsers.manager1))
      .send({ decision: 'approve', comment: 'Everything verified and filed' });

    expect(reviewRes.status).toBe(200);
    expect(currentTask.status).toBe('completed');
    expect(currentTask.completedAt).toBeDefined();
  });
});
