// ============================================================================
// File: backend/tests/duplicate-recurring.test.js
// Description: Rule 2 - Attempting to create duplicate recurring engagement returns 409
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { testUsers, createAuthHeader } from './helpers.js';

vi.mock('../src/config/prisma.js', () => {
  return {
    default: {
      serviceType: {
        findUnique: vi.fn()
      },
      $transaction: vi.fn()
    },
    prisma: {
      serviceType: {
        findUnique: vi.fn()
      },
      $transaction: vi.fn()
    }
  };
});

import prisma from '../src/config/prisma.js';
import app from '../src/app.js';

describe('Workflow Rule 2: Prevent Duplicate Recurring Engagements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with 409 when attempting to create a duplicate engagement for same client, service, and periodKey', async () => {
    const serviceTypeId = '30000000-0000-4000-a000-000000000001';
    const clientId = '20000000-0000-4000-a000-000000000001';

    // 1. Mock service type lookup
    prisma.serviceType.findUnique.mockResolvedValue({
      id: serviceTypeId,
      name: 'Monthly Accounting',
      recurrenceInterval: 'monthly',
      isRecurring: true,
      templates: [
        {
          id: 'tmpl-1',
          title: 'Bank Reconciliation',
          description: 'Reconcile bank accounts',
          offsetDaysFromPeriodStart: 5,
          requiresReview: true
        }
      ]
    });

    // 2. Mock transaction simulating Prisma P2002 Unique Constraint Violation
    prisma.$transaction.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['clientId', 'serviceTypeId', 'periodKey'] },
      message: 'Unique constraint failed on the fields: (`clientId`,`serviceTypeId`,`periodKey`)'
    });

    // Manager attempts to create the engagement
    const res = await request(app)
      .post('/api/engagements')
      .set('Authorization', createAuthHeader(testUsers.manager1))
      .send({
        clientId,
        serviceTypeId,
        title: 'Monthly Bookkeeping - Jan 2026',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-01-31T23:59:59.000Z'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Duplicate recurring engagement/i);
  });
});
