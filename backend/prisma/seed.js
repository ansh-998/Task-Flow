// ============================================================================
// File: server/prisma/seed.js
// Description: Database seeder for Prisma PostgreSQL
// ============================================================================

import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';
import { computePeriodKey } from '../src/utils/periodKey.js';

export async function seed() {
  console.log('Seeding Prisma database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  const usersData = [
    { email: 'admin@example.com', fullName: 'Aditi Sharma', role: 'admin' },
    { email: 'manager1@example.com', fullName: 'Rajesh Kumar', role: 'manager' },
    { email: 'manager2@example.com', fullName: 'Pooja Verma', role: 'manager' },
    { email: 'member1@example.com', fullName: 'Karan Patel', role: 'team_member' },
    { email: 'member2@example.com', fullName: 'Sneha Rao', role: 'team_member' },
    { email: 'member3@example.com', fullName: 'Vikram Singh', role: 'team_member' },
    { email: 'member4@example.com', fullName: 'Ananya Gupta', role: 'team_member' },
    { email: 'admin@taskflow.dev', fullName: 'Admin User', role: 'admin' },
    { email: 'sarah.manager@taskflow.dev', fullName: 'Sarah Manager', role: 'manager' },
    { email: 'alice.member@taskflow.dev', fullName: 'Alice Member', role: 'team_member' },
    { email: 'bob.member@taskflow.dev', fullName: 'Bob Member', role: 'team_member' }
  ];

  const users = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        passwordHash,
        isActive: true
      },
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
        isActive: true
      }
    });
    users[u.email] = user;
  }

  // 2. Seed Service Types
  const serviceTypesData = [
    {
      name: 'Monthly GST Compliance',
      code: 'GST-MONTHLY',
      description: 'Monthly GSTR-1, GSTR-3B reconciliation and filing service',
      isRecurring: true,
      recurrenceInterval: 'monthly'
    },
    {
      name: 'GST Registration',
      code: 'GST-REG',
      description: 'New GSTIN registration application and document preparation',
      isRecurring: false,
      recurrenceInterval: null
    },
    {
      name: 'GST Refund',
      code: 'GST-REFUND',
      description: 'Accumulated ITC and export refund application filing (RFD-01)',
      isRecurring: false,
      recurrenceInterval: null
    }
  ];

  const services = {};
  for (const s of serviceTypesData) {
    const service = await prisma.serviceType.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        description: s.description,
        isRecurring: s.isRecurring,
        recurrenceInterval: s.recurrenceInterval,
        isActive: true
      },
      create: s
    });
    services[s.code] = service;
  }

  // 3. Seed Task Templates
  const templatesData = [
    // 2 for Monthly GST Compliance
    {
      serviceCode: 'GST-MONTHLY',
      title: 'Collect client data',
      description: 'Request purchase invoices, sales summaries, and bank ledger records',
      orderIndex: 1,
      offsetDaysFromPeriodStart: 2,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    },
    {
      serviceCode: 'GST-MONTHLY',
      title: 'File GSTR-3B',
      description: 'Reconcile 2B credit, calculate tax liability, and submit return',
      orderIndex: 2,
      offsetDaysFromPeriodStart: 15,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    },
    // 1 for GST Registration
    {
      serviceCode: 'GST-REG',
      title: 'Draft and file REG-01 application',
      description: 'Collect rental agreement, KYC, and upload on portal for ARN generation',
      orderIndex: 1,
      offsetDaysFromPeriodStart: 5,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    },
    // 1 for GST Refund
    {
      serviceCode: 'GST-REFUND',
      title: 'Reconcile input tax credits and file RFD-01',
      description: 'Verify Statement 1A, calculate refund entitlement, and submit',
      orderIndex: 1,
      offsetDaysFromPeriodStart: 10,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    }
  ];

  const templates = [];
  for (const t of templatesData) {
    const existing = await prisma.taskTemplate.findFirst({
      where: {
        serviceTypeId: services[t.serviceCode].id,
        title: t.title
      }
    });

    if (existing) {
      templates.push(existing);
    } else {
      const created = await prisma.taskTemplate.create({
        data: {
          serviceTypeId: services[t.serviceCode].id,
          title: t.title,
          description: t.description,
          orderIndex: t.orderIndex,
          offsetDaysFromPeriodStart: t.offsetDaysFromPeriodStart,
          defaultAssigneeRole: t.defaultAssigneeRole,
          requiresReview: t.requiresReview,
          isActive: true
        }
      });
      templates.push(created);
    }
  }

  // 4. Seed 5 Clients
  const clientsData = [
    { name: 'Acme Traders', contactEmail: 'contact@acmetraders.com', phone: '+1-555-0101' },
    { name: 'Beta Exports', contactEmail: 'finance@betaexports.com', phone: '+1-555-0102' },
    { name: 'Apex Logistics', contactEmail: 'ops@apexlogistics.com', phone: '+1-555-0103' },
    { name: 'Nova Healthcare', contactEmail: 'accounts@novahealth.com', phone: '+1-555-0104' },
    { name: 'Zenith Tech', contactEmail: 'billing@zenithtech.io', phone: '+1-555-0105' }
  ];

  const clients = [];
  for (const c of clientsData) {
    const existing = await prisma.client.findFirst({
      where: { name: c.name }
    });

    if (existing) {
      clients.push(existing);
    } else {
      const created = await prisma.client.create({
        data: {
          ...c,
          status: 'active',
          createdById: users['admin@example.com'].id
        }
      });
      clients.push(created);
    }
  }

  // 5. Seed 4 Engagements (2 recurring, 2 one-time)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const currentPeriodKey = `${year}-${String(month).padStart(2, '0')}`;
  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0));

  const engagementsData = [
    // 2 Recurring
    {
      clientId: clients[0].id,
      serviceTypeId: services['GST-MONTHLY'].id,
      title: 'Acme Traders — Monthly GST Compliance',
      description: 'Monthly recurring GST compliance for current filing period',
      periodStart,
      periodEnd,
      periodKey: currentPeriodKey,
      managerId: users['manager1@example.com'].id,
      isRecurring: true
    },
    {
      clientId: clients[1].id,
      serviceTypeId: services['GST-MONTHLY'].id,
      title: 'Beta Exports — Monthly GST Compliance',
      description: 'Monthly recurring GST compliance for export deliveries',
      periodStart,
      periodEnd,
      periodKey: currentPeriodKey,
      managerId: users['manager2@example.com'].id,
      isRecurring: true
    },
    // 2 One-Time
    {
      clientId: clients[2].id,
      serviceTypeId: services['GST-REG'].id,
      title: 'Apex Logistics — Branch GST Registration',
      description: 'Special ad-hoc state branch registration',
      periodStart: new Date(Date.UTC(2026, 8, 1)),
      periodEnd: new Date(Date.UTC(2026, 8, 30)),
      periodKey: '2026-09-REG',
      managerId: users['manager1@example.com'].id,
      isRecurring: false
    },
    {
      clientId: clients[3].id,
      serviceTypeId: services['GST-REFUND'].id,
      title: 'Nova Healthcare — Inverted Duty GST Refund',
      description: 'Quarterly refund claim under inverted duty tariff structure',
      periodStart: new Date(Date.UTC(2026, 8, 1)),
      periodEnd: new Date(Date.UTC(2026, 8, 30)),
      periodKey: '2026-09-REFUND',
      managerId: users['manager2@example.com'].id,
      isRecurring: false
    }
  ];

  const engagements = [];
  for (const e of engagementsData) {
    const existing = await prisma.engagement.findUnique({
      where: {
        clientId_serviceTypeId_periodKey: {
          clientId: e.clientId,
          serviceTypeId: e.serviceTypeId,
          periodKey: e.periodKey
        }
      }
    });

    if (existing) {
      engagements.push(existing);
    } else {
      const created = await prisma.engagement.create({
        data: {
          ...e,
          status: 'active',
          createdById: users['admin@example.com'].id
        }
      });
      engagements.push(created);
    }
  }

  // Helper date offset function
  const offsetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  // 6. Seed 20+ Tasks with mixed statuses and due dates
  const tasksSeed = [
    // Engagement 1 (Acme Traders)
    { engIndex: 0, title: 'Collect client data', assignee: 'member1@example.com', reviewer: 'manager1@example.com', status: 'in_progress', due: offsetDate(-3) },
    { engIndex: 0, title: 'File GSTR-3B', assignee: 'member1@example.com', reviewer: 'manager1@example.com', status: 'not_started', due: offsetDate(0) },
    { engIndex: 0, title: 'Resolve vendor mismatched credits', assignee: 'member1@example.com', reviewer: 'manager1@example.com', status: 'waiting_for_client', due: offsetDate(2) },
    { engIndex: 0, title: 'Draft GSTR-3B tax computation', assignee: 'member2@example.com', reviewer: 'manager1@example.com', status: 'ready_for_review', due: offsetDate(4) },
    { engIndex: 0, title: 'Verify electronic cash ledger balance', assignee: 'member3@example.com', reviewer: 'manager1@example.com', status: 'in_progress', due: offsetDate(-4) },
    { engIndex: 0, title: 'Quarterly compliance summary dispatch', assignee: 'member3@example.com', reviewer: 'manager1@example.com', status: 'not_started', due: offsetDate(15) },

    // Engagement 2 (Beta Exports)
    { engIndex: 1, title: 'Collect client data', assignee: 'member2@example.com', reviewer: 'manager2@example.com', status: 'in_progress', due: offsetDate(1) },
    { engIndex: 1, title: 'File GSTR-3B', assignee: 'member2@example.com', reviewer: 'manager2@example.com', status: 'not_started', due: offsetDate(12) },
    { engIndex: 1, title: 'Verify BRC and FIRC documents', assignee: 'member3@example.com', reviewer: 'manager2@example.com', status: 'waiting_for_client', due: offsetDate(-1) },
    { engIndex: 1, title: 'Verify GST tax challan payment', assignee: 'member3@example.com', reviewer: 'manager2@example.com', status: 'ready_for_review', due: offsetDate(3) },
    { engIndex: 1, title: 'Export turnover reconciliation with EDPMS', assignee: 'member4@example.com', reviewer: 'manager2@example.com', status: 'in_progress', due: offsetDate(6) },
    { engIndex: 1, title: 'Archival of client acknowledgment receipts', assignee: 'member4@example.com', reviewer: 'manager2@example.com', status: 'completed', due: offsetDate(-12) },

    // Engagement 3 (Apex Logistics)
    { engIndex: 2, title: 'Draft and file REG-01 application', assignee: 'member3@example.com', reviewer: 'manager1@example.com', status: 'completed', due: offsetDate(-7) },
    { engIndex: 2, title: 'Collate rental agreement & electricity bill', assignee: 'member3@example.com', reviewer: 'manager1@example.com', status: 'completed', due: offsetDate(-5) },
    { engIndex: 2, title: 'Complete promoter Aadhaar OTP authentication', assignee: 'member4@example.com', reviewer: 'manager1@example.com', status: 'changes_requested', due: offsetDate(-2) },
    { engIndex: 2, title: 'Respond to officer clarification notice', assignee: 'member4@example.com', reviewer: 'manager1@example.com', status: 'in_progress', due: offsetDate(2) },
    { engIndex: 2, title: 'Verify authorized representative authorization letter', assignee: 'member1@example.com', reviewer: 'manager1@example.com', status: 'completed', due: offsetDate(-10) },

    // Engagement 4 (Nova Healthcare)
    { engIndex: 3, title: 'Reconcile input tax credits and file RFD-01', assignee: 'member4@example.com', reviewer: 'manager2@example.com', status: 'not_started', due: offsetDate(0) },
    { engIndex: 3, title: 'Calculate inverted duty refund entitlement', assignee: 'member1@example.com', reviewer: 'manager2@example.com', status: 'ready_for_review', due: offsetDate(1) },
    { engIndex: 3, title: 'Client sign-off on refund annexure', assignee: 'member1@example.com', reviewer: 'manager2@example.com', status: 'waiting_for_client', due: offsetDate(5) },
    { engIndex: 3, title: 'File online application in RFD-01 portal', assignee: 'member2@example.com', reviewer: 'manager2@example.com', status: 'not_started', due: offsetDate(8) },
    { engIndex: 3, title: 'Compile supplier 2A/2B verification annexure', assignee: 'member2@example.com', reviewer: 'manager2@example.com', status: 'ready_for_review', due: offsetDate(2) }
  ];

  for (const t of tasksSeed) {
    const eng = engagements[t.engIndex];
    const existing = await prisma.task.findFirst({
      where: {
        engagementId: eng.id,
        title: t.title
      }
    });

    if (!existing) {
      const created = await prisma.task.create({
        data: {
          engagementId: eng.id,
          title: t.title,
          description: `Standard workflow instructions for ${t.title}`,
          assigneeId: users[t.assignee].id,
          reviewerId: users[t.reviewer].id,
          status: t.status,
          dueDate: t.due,
          createdById: users['admin@example.com'].id
        }
      });

      await prisma.taskActivity.create({
        data: {
          taskId: created.id,
          actorId: users['admin@example.com'].id,
          fromStatus: null,
          toStatus: t.status,
          action: 'created',
          comment: 'Initialized from demonstration seed'
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
}

// Auto-execute if run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seed()
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
