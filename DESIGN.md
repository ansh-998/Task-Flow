# TaskFlow — System Design Document

Welcome to the design documentation for **TaskFlow**. This document explains how TaskFlow is built, how data moves through the system, and why key engineering decisions were made — all in plain, straightforward English.

---

## 1. What is TaskFlow?

**TaskFlow** is a task and workflow management system designed specifically for professional service firms (like accounting, tax, and legal practices).

### The Problem it Solves
In accounting and compliance firms:
- The same services happen repeatedly (e.g., Monthly GST Filing, Quarterly Audits, Annual Tax Returns).
- Each service has a specific checklist of tasks that must be done in order.
- Deadlines are strict, and missing one causes legal penalties for clients.
- Work requires peer review: **a person cannot approve their own work**.

TaskFlow automates this entire process: it auto-generates recurring engagements, spawns task checklists from blueprint templates, enforces strict state transitions, and guarantees full audit trails.

---

## 2. High-Level Architecture

TaskFlow uses a modern, decoupled **3-tier architecture**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      1. FRONTEND TIER                       │
 │                    React 18 + Vite SPA                      │
 │   - Clean UI written in Plain CSS (No Tailwind / UI kits)   │
 │   - Fast, reactive Single Page Application (Vite build)     │
 │   - Hosted on Vercel / Netlify CDN                          │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                │ HTTPS JSON REST API
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                      2. BACKEND TIER                        │
 │                   Node.js + Express.js                      │
 │   - Routes, Controllers, and Service Layers (MVC)           │
 │   - Zod Validation for all inputs                           │
 │   - JWT Authentication & Role-Based Access Control (RBAC)   │
 │   - Built-in Cron Scheduler for recurring deliverables      │
 │   - Hosted on Render / Railway                              │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                │ Prisma ORM (SQL Queries)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                      3. DATABASE TIER                       │
 │                     PostgreSQL Database                     │
 │   - Managed on Neon.tech with PgBouncer connection pooling  │
 │   - Strict foreign keys and unique constraints              │
 │   - Immutable audit logs                                    │
 └─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Concepts & Data Model

To understand TaskFlow, you only need to understand **6 core entities**:

```
  ┌──────────┐
  │  Client  │ (e.g. Acme Traders)
  └────┬─────┘
       │ 1
       │ has many
       ▼ *
  ┌──────────────┐          ┌────────────────┐
  │  Engagement  │◀─────────┤  Service Type  │ (e.g. Monthly GST Filing)
  └────┬─────────┘  created └───────┬────────┘
       │ 1          from            │ 1
       │ has many                   │ has blueprint
       ▼ *                          ▼ *
  ┌──────────┐              ┌────────────────┐
  │   Task   │◀─────────────┤  Task Template │ (e.g. Step 1: Collect invoices)
  └────┬─────┘  spawned     └────────────────┘
       │ 1      from
       │ records
       ▼ *
  ┌──────────────┐
  │ TaskActivity │ (Immutable history: who did what and when)
  └──────────────┘
```

### What Each Entity Means:

1. **User**: A team member, manager, or administrator who logs in to TaskFlow.
2. **Client**: A company or individual receiving professional services (e.g., *Acme Traders*).
3. **Service Type**: The master catalog of services offered (e.g., *Monthly GST Compliance*, *Annual Audit*).
4. **Task Template**: The blueprint recipe for a service. If *Monthly GST Compliance* has 3 steps, there are 3 Task Templates attached to it with due-date offsets.
5. **Engagement**: A specific contract/deliverable for a client in a specific time window.
   - *Example*: Acme Traders — Monthly GST Compliance for **September 2026** (Period Key: `2026-09`).
6. **Task**: The actual to-do item created inside an engagement. Assigned to a worker, reviewed by a manager, with a calculated deadline.
7. **Task Activity**: An append-only audit trail record created every time a task status changes, is assigned, or is reviewed.

---

## 4. How Tasks Move: The Workflow State Machine

Tasks cannot jump to random statuses. They follow a strict, logical path from start to finish:

```
                  ┌──────────────┐
                  │ not_started  │
                  └──────┬───────┘
                         │ Worker clicks "Start Work"
                         ▼
                  ┌──────────────┐
       ┌──────────┤ in_progress  │◀──────────────┐
       │          └──────┬───────┘               │
       │                 │                       │
Waiting for client       │ Worker finishes draft │ Changes requested
       │                 ▼                       │ by reviewer
       │          ┌──────────────────┐           │
       │          │ ready_for_review │───────────┘
       │          └──────┬───────────┘
       │                 │
       ▼                 │ Reviewer approves
┌────────────────────┐   ▼
│ waiting_for_client │ ┌───────────┐
└────────────────────┘ │ completed │
                       └───────────┘
```

### The Rules of the Workflow:
1. **You Start in `not_started`**: When an engagement is created, all template tasks are spawned in `not_started`.
2. **Work in Progress**: The worker marks the task `in_progress`.
3. **Pausing**: If the worker needs documents from the client, they can move it to `waiting_for_client` and resume later.
4. **Ready for Review**: When finished, the worker submits the task to `ready_for_review`.
5. **Approval**: Only the designated reviewer, manager, or admin can approve or request changes.

### The Anti-Self-Approval Rule (Crucial Invariant)
> **A worker CANNOT approve their own work.**
> 
> If Karan Patel is assigned to a task, Karan cannot click "Approve & Complete". The system enforces this at the API service layer with an HTTP `403 Forbidden` error. This guarantees compliance integrity for the firm.

---

## 5. User Roles: Who Can Do What?

TaskFlow uses simple, intuitive **Role-Based Access Control (RBAC)**:

| Feature / Action | Admin | Manager | Team Member |
|---|:---:|:---:|:---:|
| **View Dashboard & KPI Metrics** | ✅ All Firm Data | ✅ Managed Engagements | ✅ Assigned Tasks |
| **Manage Users & Roles** | ✅ Yes | ❌ No | ❌ No |
| **Manage Service Catalog & Templates** | ✅ Yes | ❌ No | ❌ No |
| **Add & Update Clients** | ✅ Yes | ✅ Yes | ❌ Read-Only |
| **Create New Engagements** | ✅ Yes | ✅ Yes | ❌ Read-Only |
| **Assign / Reassign Tasks & Due Dates**| ✅ Yes | ✅ Yes (Their Engagements)| ❌ No |
| **Work on Tasks (`in_progress`)** | ✅ Yes | ✅ Yes | ✅ Assigned Tasks |
| **Review & Approve Tasks** | ✅ Yes | ✅ Yes | ✅ If Assigned Reviewer (not worker) |

---

## 6. The Automation Engine: Recurring Deliverables

Many services repeat every month or quarter. Instead of managers manually creating hundreds of tasks on the 1st of every month, TaskFlow does it automatically.

### How It Works:
1. **The Clock**: Every night at **02:00 UTC**, a background job runs (`backend/src/cron/recurring.js`).
2. **Check Active Recurring Services**: The system finds all services marked `isRecurring: true` (e.g. Monthly GST).
3. **Calculate the Next Period Key**:
   - `2026-08` becomes `2026-09` (Monthly)
   - `2026-Q1` becomes `2026-Q2` (Quarterly)
4. **Deduplication Check (Idempotency)**:
   - Before creating anything, TaskFlow checks if `[clientId, serviceTypeId, periodKey]` already exists.
   - If it exists, it skips safely. It will **never create duplicate tasks**.
5. **Atomic Transaction**:
   - Creates the new Engagement.
   - Clones all active Task Templates into concrete tasks with calculated due dates.
   - Writes an audit log entry in `AutomationLog`.
   - All done inside a single `prisma.$transaction`. If anything fails, nothing is saved.

---

## 7. Security & Defensive Design

TaskFlow is built for production environments where data integrity and security matter:

1. **Password Security**: Passwords are never stored in plain text. They are hashed using **bcrypt** with 10 salt rounds.
2. **Stateless Authentication**: Fast, secure **JSON Web Tokens (JWT)** passed via the `Authorization: Bearer <token>` HTTP header.
3. **Fail-Fast Startup**: If critical configuration variables like `DATABASE_URL` or `JWT_SECRET` are missing, the server halts immediately on boot with a clear error rather than running insecurely.
4. **Brute-Force Rate Limiting**: The login endpoint allows a maximum of 10 attempts per minute per IP to protect against automated password guessing.
5. **CORS Lockdown**: Only authorized frontend URLs (like `https://your-app.vercel.app`) are allowed to send API requests.
6. **Input Validation (Zod)**: Every single API endpoint checks incoming parameters, IDs, and body data with Zod schemas before running any business logic.
7. **Graceful Shutdown**: When stopping or redeploying the server, it finishes active requests and cleanly disconnects database connections before shutting down.

---

## 8. Scaling: How TaskFlow Handles 5 Million Tasks

If a firm grows to tens of thousands of clients and millions of tasks, here is how the architecture effortlessly scales:

1. **Database Indexes**:
   - Tasks are indexed by `(assigneeId, status, dueDate)` so a worker's "My Tasks" query loads in milliseconds regardless of table size.
   - Engagements are indexed by `(clientId, serviceTypeId, periodKey)` for instant uniqueness checks.
2. **Connection Pooling**:
   - Uses Neon's built-in **PgBouncer** pooler (`DATABASE_URL`), allowing thousands of simultaneous requests without exhausting database connections.
3. **Future Partitioning**:
   - The `Task` and `TaskActivity` tables can be range-partitioned by year or quarter in PostgreSQL, keeping active working datasets compact and ultra-fast.
4. **Queue-Based Workers**:
   - The daily recurring generator can easily be shifted from `node-cron` to a distributed queue like **BullMQ** or **AWS SQS** to process large client batches across multiple worker instances.

---

## 9. Summary Table of Tech Stack

| Layer | Choice | Why We Chose It |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Fast build times, modern hooks, small bundle size |
| **Styling** | Plain Semantic CSS | Zero dependency overhead, clean native variables, no build lock-in |
| **Routing** | React Router v6 | Declarative client-side routing with clean protected route guards |
| **Backend Runtime** | Node.js (v20 LTS) + Express | Industry standard, lightweight, huge ecosystem |
| **Validation** | Zod | Strict schema validation with clean error messages |
| **Database** | PostgreSQL 15+ via Neon | Reliable ACID relational database with serverless connection pooling |
| **ORM** | Prisma | Clean data modeling, type-safe queries, migration tracking |
| **Deployment** | Render (API) + Vercel (SPA) | Pure cloud deployment directly from GitHub with zero Docker complexity |
