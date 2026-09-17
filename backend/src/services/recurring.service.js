// ============================================================================
// File: backend/src/services/recurring.service.js
// Description: Automated recurring period generator with idempotency and transaction isolation
//
// LEARNING NOTES — HOW RECURRING GENERATION WORKS:
// 1. DISCOVERY: Queries all active services marked with `isRecurring: true`.
// 2. TIMELINE PROJECTION: For each client with an existing engagement, it uses
//    computeNextPeriod() to determine the next period key (e.g., '2026-01' -> '2026-02').
// 3. IDEMPOTENCY: Before creating anything, it checks if an engagement already exists
//    for (clientId, serviceTypeId, nextPeriodKey). If it does, it skips safely.
// 4. ATOMIC CLONING: In a single prisma.$transaction, it creates the new engagement,
//    clones all active task templates with offset due dates, and writes an audit log.
// 5. SAFETY & RECOVERY: If a race condition occurs, PostgreSQL's composite unique constraint
//    throws error P2002, which is caught and counted as 'skipped', preventing duplicates.
// ============================================================================

import prisma from '../config/prisma.js';
import serviceTypeModel from '../models/serviceType.model.js';
import engagementModel from '../models/engagement.model.js';
import clientModel from '../models/client.model.js';
import taskModel from '../models/task.model.js';
import taskActivityModel from '../models/taskActivity.model.js';
import automationLogModel from '../models/automationLog.model.js';
import { computeNextPeriod } from '../utils/periodKey.js';

export async function generateNextPeriod() {
  const summary = {
    processed: 0,
    created: 0,
    skipped: 0,
    errors: 0
  };

  // STEP 1: Fetch active recurring service types along with their task templates
  const recurringServices = await serviceTypeModel.findMany({
    isActive: true,
    isRecurring: true,
    recurrenceInterval: { not: null }
  }, {
    include: {
      templates: {
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  for (const service of recurringServices) {
    // STEP 2: Fetch all engagements for this service to find client history
    const engagements = await engagementModel.findMany(
      { serviceTypeId: service.id },
      { orderBy: { periodStart: 'desc' } }
    );

    if (engagements.length === 0) continue;

    // Group by client and get latest engagement
    const latestByClient = new Map();
    for (const eng of engagements) {
      if (!latestByClient.has(eng.clientId)) {
        latestByClient.set(eng.clientId, eng);
      }
    }

    for (const [clientId, latestEng] of latestByClient.entries()) {
      summary.processed += 1;

      try {
        const { periodKey: nextKey, periodStart, periodEnd } = computeNextPeriod(
          latestEng.periodKey,
          service.recurrenceInterval
        );

        // Check if next period engagement already exists
        const existingNext = await engagementModel.findByPeriodKey(clientId, service.id, nextKey);

        if (existingNext) {
          summary.skipped += 1;
          continue;
        }

        // Try create engagement and tasks in transaction
        await prisma.$transaction(async (tx) => {
          const client = await clientModel.findById(clientId);
          const clientName = client ? client.name : 'Client';

          const newEng = await engagementModel.create({
            clientId,
            serviceTypeId: service.id,
            title: `${clientName} — ${service.name} (${nextKey})`,
            description: `Automated recurring compliance engagement for period ${nextKey}`,
            periodStart,
            periodEnd,
            periodKey: nextKey,
            status: 'active',
            managerId: latestEng.managerId,
            isRecurring: true,
            parentEngagementId: latestEng.id,
            createdById: latestEng.createdById
          }, tx);

          // Replicate templates in bulk using createMany
          const templates = service.templates || [];
          if (templates.length > 0) {
            const tasksToCreate = templates.map((template) => {
              const dueDate = new Date(periodStart);
              dueDate.setDate(dueDate.getDate() + template.offsetDaysFromPeriodStart);

              return {
                engagementId: newEng.id,
                templateId: template.id,
                title: template.title,
                description: template.description,
                reviewerId: template.requiresReview ? latestEng.managerId : null,
                status: 'not_started',
                dueDate,
                createdById: latestEng.createdById
              };
            });

            await taskModel.createMany(tasksToCreate, tx);
          }

          // Log success in automation_log
          await automationLogModel.create({
            engagementId: newEng.id,
            status: 'success',
            message: `Generated recurring engagement ${newEng.id} (${nextKey}) for client ${clientId}`
          }, tx);

          summary.created += 1;
        });
      } catch (err) {
        if (err.code === 'P2002') {
          summary.skipped += 1;
          continue;
        }

        summary.errors += 1;
        console.error(`Error generating recurring period for client ${clientId}:`, err);

        await automationLogModel.create({
          engagementId: latestEng.id,
          status: 'failed',
          message: `Failed generation for client ${clientId}: ${err.message}`
        }).catch(() => null);
      }
    }
  }

  return summary;
}

export default {
  generateNextPeriod
};
