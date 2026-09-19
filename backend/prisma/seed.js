// ============================================================================
// File: backend/prisma/seed.js
// Description: Database wiper & seeder for Prisma PostgreSQL
// ============================================================================

import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

export async function seed() {
  console.log('--- Wiping existing database records ---');

  // Delete in reverse foreign key dependency order
  await prisma.taskActivity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.automationLog.deleteMany();
  await prisma.engagement.deleteMany();
  await prisma.taskTemplate.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database wiped successfully.');
  console.log('--- Seeding new records ---');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  const usersData = [
    { email: 'admin@taskflow.com', fullName: 'Aditi Sharma', role: 'admin' },
    { email: 'manager1@taskflow.com', fullName: 'Rajesh Kumar', role: 'manager' },
    { email: 'manager2@taskflow.com', fullName: 'Pooja Verma', role: 'manager' },
    { email: 'member1@taskflow.com', fullName: 'Karan Patel', role: 'team_member' },
    { email: 'member2@taskflow.com', fullName: 'Sneha Rao', role: 'team_member' },
    { email: 'member3@taskflow.com', fullName: 'Vikram Singh', role: 'team_member' }
  ];

  const users = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
        isActive: true
      }
    });
    users[u.email] = user;
    console.log(`Created user: ${user.fullName} (${user.email}) - ${user.role}`);
  }

  // 2. Seed Clients
  const clientsData = [
    { name: 'Acme Traders', contactEmail: 'contact@acmetraders.com' },
    { name: 'Beta Exports', contactEmail: 'finance@betaexports.com' },
    { name: 'Nova Healthcare', contactEmail: 'accounts@novahealth.com' }
  ];

  const clients = {};
  for (const c of clientsData) {
    const client = await prisma.client.create({
      data: {
        name: c.name,
        contactEmail: c.contactEmail,
        status: 'active',
        createdById: users['admin@taskflow.com'].id
      }
    });
    clients[c.name] = client;
    console.log(`Created client: ${client.name} (${client.contactEmail})`);
  }

  // 3. Seed Service Types
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
    const service = await prisma.serviceType.create({
      data: s
    });
    services[s.code] = service;
    console.log(`Created service type: ${service.name} (${service.code})`);
  }

  // 4. Seed Task Templates
  const templatesData = [
    {
      serviceCode: 'GST-MONTHLY',
      title: 'Collect invoices from client',
      description: 'Collect purchase invoices, sales summaries, and bank ledger records',
      orderIndex: 1,
      offsetDaysFromPeriodStart: 2,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    },
    {
      serviceCode: 'GST-MONTHLY',
      title: 'File GSTR-3B return',
      description: 'Reconcile 2B credit, calculate tax liability, and submit return',
      orderIndex: 2,
      offsetDaysFromPeriodStart: 15,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    },
    {
      serviceCode: 'GST-REG',
      title: 'Submit REG-01 application',
      description: 'Collect rental agreement, KYC, and upload on portal for ARN generation',
      orderIndex: 1,
      offsetDaysFromPeriodStart: 5,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    },
    {
      serviceCode: 'GST-REFUND',
      title: 'File RFD-01 with documents',
      description: 'Verify Statement 1A, calculate refund entitlement, and submit RFD-01',
      orderIndex: 1,
      offsetDaysFromPeriodStart: 10,
      defaultAssigneeRole: 'team_member',
      requiresReview: true
    }
  ];

  const templates = {};
  for (const t of templatesData) {
    const template = await prisma.taskTemplate.create({
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
    templates[`${t.serviceCode}_${t.title}`] = template;
    console.log(`Created template: ${template.title} for ${t.serviceCode}`);
  }

  // 5. Seed Engagements (Period: Sep 2026)
  const periodKey = '2026-09';
  const periodStart = new Date(Date.UTC(2026, 8, 1));
  const periodEnd = new Date(Date.UTC(2026, 8, 30, 23, 59, 59, 999));

  const engagementsData = [
    {
      clientName: 'Acme Traders',
      serviceCode: 'GST-MONTHLY',
      title: 'Acme Traders — Monthly GST Compliance (Sep 2026)',
      managerEmail: 'manager1@taskflow.com',
      isRecurring: true
    },
    {
      clientName: 'Beta Exports',
      serviceCode: 'GST-REG',
      title: 'Beta Exports — GST Registration (Sep 2026)',
      managerEmail: 'manager2@taskflow.com',
      isRecurring: false
    },
    {
      clientName: 'Nova Healthcare',
      serviceCode: 'GST-REFUND',
      title: 'Nova Healthcare — GST Refund (Sep 2026)',
      managerEmail: 'manager1@taskflow.com',
      isRecurring: false
    }
  ];

  const engagements = {};
  for (const e of engagementsData) {
    const eng = await prisma.engagement.create({
      data: {
        clientId: clients[e.clientName].id,
        serviceTypeId: services[e.serviceCode].id,
        title: e.title,
        periodStart,
        periodEnd,
        periodKey,
        status: 'active',
        managerId: users[e.managerEmail].id,
        isRecurring: e.isRecurring,
        createdById: users['admin@taskflow.com'].id
      }
    });
    engagements[e.clientName] = eng;
    console.log(`Created engagement: ${eng.title}`);
  }

  // Helper date offset function for dynamic relative dates
  const offsetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  // 6. Seed Tasks
  // Exact user specification:
  // 1: Collect invoices from client | Acme Traders GST | Karan Patel | Rajesh Kumar | In Progress | 3 days ago (overdue)
  // 2: File GSTR-3B return | Acme Traders GST | Sneha Rao | Rajesh Kumar | Not Started | Today
  // 3: Submit REG-01 application | Beta Exports REG | Vikram Singh | Pooja Verma | Ready for Review | Sep 20
  // 4: Collect KYC documents | Beta Exports REG | Karan Patel | Pooja Verma | Completed | Sep 10
  // 5: File RFD-01 with documents | Nova Healthcare REFUND | Sneha Rao | Rajesh Kumar | Waiting for Client | Sep 22
  // 6: Prepare refund calculation | Nova Healthcare REFUND | Vikram Singh | Rajesh Kumar | Changes Requested | Sep 18 (Future relative to today to maintain Open=5, Overdue=1)

  const tasksSeed = [
    {
      clientKey: 'Acme Traders',
      templateKey: 'GST-MONTHLY_Collect invoices from client',
      title: 'Collect invoices from client',
      description: 'Collect purchase invoices, sales summaries, and bank ledger records',
      assigneeEmail: 'member1@taskflow.com',
      reviewerEmail: 'manager1@taskflow.com',
      status: 'in_progress',
      dueDate: offsetDate(-3),
      startedAt: offsetDate(-5),
      completedAt: null
    },
    {
      clientKey: 'Acme Traders',
      templateKey: 'GST-MONTHLY_File GSTR-3B return',
      title: 'File GSTR-3B return',
      description: 'Reconcile 2B credit, calculate tax liability, and submit return',
      assigneeEmail: 'member2@taskflow.com',
      reviewerEmail: 'manager1@taskflow.com',
      status: 'not_started',
      dueDate: offsetDate(0),
      startedAt: null,
      completedAt: null
    },
    {
      clientKey: 'Beta Exports',
      templateKey: 'GST-REG_Submit REG-01 application',
      title: 'Submit REG-01 application',
      description: 'Prepare KYC documents, rental agreement, and submit REG-01 on portal',
      assigneeEmail: 'member3@taskflow.com',
      reviewerEmail: 'manager2@taskflow.com',
      status: 'ready_for_review',
      dueDate: offsetDate(1),
      startedAt: offsetDate(-4),
      completedAt: null
    },
    {
      clientKey: 'Beta Exports',
      templateKey: null,
      title: 'Collect KYC documents',
      description: 'Collect director PAN, Aadhaar, and electricity bill for branch registration',
      assigneeEmail: 'member1@taskflow.com',
      reviewerEmail: 'manager2@taskflow.com',
      status: 'completed',
      dueDate: offsetDate(-9),
      startedAt: offsetDate(-12),
      completedAt: offsetDate(-9)
    },
    {
      clientKey: 'Nova Healthcare',
      templateKey: 'GST-REFUND_File RFD-01 with documents',
      title: 'File RFD-01 with documents',
      description: 'Verify Statement 1A, calculate refund entitlement, and submit RFD-01',
      assigneeEmail: 'member2@taskflow.com',
      reviewerEmail: 'manager1@taskflow.com',
      status: 'waiting_for_client',
      dueDate: offsetDate(3),
      startedAt: offsetDate(-2),
      completedAt: null
    },
    {
      clientKey: 'Nova Healthcare',
      templateKey: null,
      title: 'Prepare refund calculation',
      description: 'Prepare reconciliation statement between books and GSTR-2B for inverted duty claim',
      assigneeEmail: 'member3@taskflow.com',
      reviewerEmail: 'manager1@taskflow.com',
      status: 'changes_requested',
      dueDate: offsetDate(2),
      startedAt: offsetDate(-3),
      completedAt: null
    }
  ];

  for (const t of tasksSeed) {
    const eng = engagements[t.clientKey];
    const template = t.templateKey ? templates[t.templateKey] : null;

    const task = await prisma.task.create({
      data: {
        engagementId: eng.id,
        templateId: template ? template.id : null,
        title: t.title,
        description: t.description,
        assigneeId: users[t.assigneeEmail].id,
        reviewerId: users[t.reviewerEmail].id,
        status: t.status,
        dueDate: t.dueDate,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        createdById: users['admin@taskflow.com'].id
      }
    });

    // Create activity logs based on status
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        actorId: users['admin@taskflow.com'].id,
        fromStatus: null,
        toStatus: 'not_started',
        action: 'created',
        comment: 'Initialized from demonstration seed'
      }
    });

    if (t.status === 'in_progress') {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: users[t.assigneeEmail].id,
          fromStatus: 'not_started',
          toStatus: 'in_progress',
          action: 'status_change',
          comment: 'Started document collection'
        }
      });
    } else if (t.status === 'ready_for_review') {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: users[t.assigneeEmail].id,
          fromStatus: 'in_progress',
          toStatus: 'ready_for_review',
          action: 'status_change',
          comment: 'Application drafted and ready for review'
        }
      });
    } else if (t.status === 'completed') {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: users[t.reviewerEmail].id,
          fromStatus: 'ready_for_review',
          toStatus: 'completed',
          action: 'review',
          comment: 'All KYC documents verified and approved',
          metadata: { decision: 'approve' }
        }
      });
    } else if (t.status === 'waiting_for_client') {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: users[t.assigneeEmail].id,
          fromStatus: 'in_progress',
          toStatus: 'waiting_for_client',
          action: 'status_change',
          comment: 'Awaiting export invoices and BRC copies from client accounts team'
        }
      });
    } else if (t.status === 'changes_requested') {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: users[t.reviewerEmail].id,
          fromStatus: 'ready_for_review',
          toStatus: 'changes_requested',
          action: 'review',
          comment: 'Please cross-verify turnover figures with Statement 1A before final sign-off',
          metadata: { decision: 'request_changes' }
        }
      });
    }

    console.log(`Created task: "${task.title}" [${task.status}]`);
  }

  console.log('--- Seeding completed successfully! ---');
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
