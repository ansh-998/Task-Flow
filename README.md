# TaskFlow — Engagement & Task Management Platform

**TaskFlow** is a minimal, complete, and robust full-stack task and recurring engagement management system engineered specifically for professional services teams (accounting, taxation, legal, and compliance firms).

The project is architected into two fully separated, standalone applications:
- **`backend/`**: Node.js + Express REST API with a pure **MVC layout**, PostgreSQL database with Prisma ORM, JWT authentication, and automated recurring job scheduling.
- **`frontend/`**: React 18 Single Page Application (SPA) powered by Vite, React Router v6, dedicated resource API callers, and a custom plain CSS design system.

---

## Architecture & Root Layout

```
task-engagement-tool/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # PostgreSQL schema with models, enums & composite keys
│   │   ├── migrations/                # Database migrations
│   │   └── seed.js                    # Database seeder (7 users, 5 clients, 3 services, 4 templates, 4 engagements, 22 tasks)
│   ├── src/
│   │   ├── index.js                   # Server listener & cron bootstrap
│   │   ├── app.js                     # Express app setup & route mounting
│   │   ├── config/
│   │   │   ├── prisma.js              # PrismaClient singleton (sole DB client import)
│   │   │   └── env.js                 # Centralized environment configuration
│   │   ├── models/                    # Data Access Layer (Prisma queries only)
│   │   │   ├── user.model.js
│   │   │   ├── client.model.js
│   │   │   ├── serviceType.model.js
│   │   │   ├── taskTemplate.model.js
│   │   │   ├── engagement.model.js
│   │   │   ├── task.model.js
│   │   │   ├── taskActivity.model.js
│   │   │   └── automationLog.model.js
│   │   ├── services/                  # Business Logic & Transactions Layer
│   │   │   ├── auth.service.js
│   │   │   ├── user.service.js
│   │   │   ├── client.service.js
│   │   │   ├── serviceType.service.js
│   │   │   ├── taskTemplate.service.js
│   │   │   ├── engagement.service.js
│   │   │   ├── task.service.js
│   │   │   ├── recurring.service.js
│   │   │   └── dashboard.service.js
│   │   ├── controllers/               # Thin HTTP Controllers (5-10 lines, asyncHandler)
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── client.controller.js
│   │   │   ├── serviceType.controller.js
│   │   │   ├── taskTemplate.controller.js
│   │   │   ├── engagement.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── routes/                    # HTTP Route Declarations & Aggregator
│   │   │   ├── index.js               # Main API route aggregator (/api/*)
│   │   │   ├── auth.routes.js         # /api/auth
│   │   │   ├── user.routes.js         # /api/users
│   │   │   ├── client.routes.js       # /api/clients
│   │   │   ├── serviceType.routes.js  # /api/service-types
│   │   │   ├── taskTemplate.routes.js # /api/templates
│   │   │   ├── engagement.routes.js   # /api/engagements
│   │   │   ├── task.routes.js         # /api/tasks
│   │   │   ├── dashboard.routes.js    # /api/dashboard
│   │   │   └── internal.routes.js     # /api/internal
│   │   ├── middleware/                # Express Middleware Chain
│   │   │   ├── auth.js                # JWT verification
│   │   │   ├── requireRole.js         # RBAC guard (admin, manager, team_member)
│   │   │   ├── validate.js            # Zod schema validation
│   │   │   └── errorHandler.js        # Global error handler (P2002 -> 409, P2025 -> 404)
│   │   ├── validators/                # Named Zod Validation Schemas
│   │   │   ├── auth.validator.js
│   │   │   ├── user.validator.js
│   │   │   ├── client.validator.js
│   │   │   ├── serviceType.validator.js
│   │   │   ├── taskTemplate.validator.js
│   │   │   ├── engagement.validator.js
│   │   │   └── task.validator.js
│   │   ├── cron/
│   │   │   └── recurring.js           # node-cron scheduler (0 2 * * *)
│   │   └── utils/
│   │       ├── errors.js              # AppError class
│   │       ├── periodKey.js           # Period key generators (YYYY-MM, YYYY-QN, YYYY)
│   │       └── asyncHandler.js        # Controller async wrapper
│   ├── tests/                         # Vitest + Supertest Integration Suite
│   │   ├── setup.js                   # Test environment setup
│   │   ├── helpers.js                 # Auth tokens & fixtures
│   │   ├── unauthorized-task-update.test.js # Rule 1: 403 on cross-user modification
│   │   ├── duplicate-recurring.test.js      # Rule 2: 409 on duplicate period
│   │   ├── invalid-transition.test.js       # Rule 3: 400 on illegal transition
│   │   ├── manager-approval.test.js         # Rule 4: 200 on review approval
│   │   └── self-approval.test.js            # Rule 5: 403 on anti-self-approval
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── vitest.config.js
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── main.jsx                   # React root entry point
│   │   ├── App.jsx                    # Route hierarchy & protected route wrappers
│   │   ├── api/                       # Dedicated Resource API Callers (sole fetch callers)
│   │   │   ├── client.js              # Fetch client with auto Authorization header
│   │   │   ├── auth.api.js
│   │   │   ├── users.api.js
│   │   │   ├── clients.api.js
│   │   │   ├── serviceTypes.api.js
│   │   │   ├── templates.api.js
│   │   │   ├── engagements.api.js
│   │   │   ├── tasks.api.js
│   │   │   └── dashboard.api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Auth state provider (login, logout, user)
│   │   ├── components/                # Reusable Presentational Components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── TaskTable.jsx
│   │   │   ├── TaskDrawer.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── FormField.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── pages/                     # Route Pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyTasks.jsx
│   │   │   ├── Engagements.jsx
│   │   │   ├── EngagementDetail.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminServiceTypes.jsx
│   │   │   ├── AdminTemplates.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Unauthorized.jsx
│   │   ├── hooks/                     # Custom React Hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useFetch.js
│   │   │   └── useRole.js
│   │   ├── utils/                     # Formatting & Pure Helpers
│   │   │   ├── formatDate.js
│   │   │   ├── statusColors.js
│   │   │   └── constants.js
│   │   └── styles.css                 # Pure CSS design system (zero Tailwind)
│   ├── index.html
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
├── README.md
├── DESIGN.md
├── LEARN.md
├── TESTING.md
├── deployment.md
└── .gitignore
```

---

## Getting Started

### 1. Backend Setup & Run

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables (JWT_SECRET & DATABASE_URL are required)
# Copy example env and supply your PostgreSQL connection string and secret:
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed database with demo accounts & engagements
npm run seed

# Run server on port 4000
npm run dev

# Run Vitest integration tests
npm test
```

> **Note on Environment Validation:** `DATABASE_URL` and `JWT_SECRET` are strictly required. At startup, the server validates them fail-fast and will terminate immediately if either is missing. Fallback secrets are prohibited in production.

### 2. Frontend Setup & Run

```bash
cd frontend

# Install dependencies
npm install

# Run dev server on port 5173
npm run dev

# Build production bundle
npm run build
```

---

## Seed Accounts & Quick Demo Logins

Password for all accounts: `password123`

| Role | Email | Name | Capabilities |
|---|---|---|---|
| **Admin** | `admin@taskflow.dev` | System Administrator | Full access: user administration, service types, templates, engagements, tasks |
| **Manager** | `sarah.manager@taskflow.dev` | Sarah Jenkins | Create engagements, assign tasks, review worker deliverables |
| **Manager** | `marcus.manager@taskflow.dev` | Marcus Vance | Create engagements, assign tasks, review worker deliverables |
| **Team Member** | `alice.member@taskflow.dev` | Alice Walker | Work on assigned tasks, transition status, request client info, submit for review |
| **Team Member** | `bob.member@taskflow.dev` | Bob Davis | Work on assigned tasks, submit for review |
| **Team Member** | `carol.member@taskflow.dev` | Carol Lin | Work on assigned tasks, submit for review |
| **Team Member** | `david.member@taskflow.dev` | David Kim | Work on assigned tasks, submit for review |

> On the login page (`/login`), click the **Admin**, **Manager**, or **Member** 1-click demo buttons to sign in instantly.

---

## Architectural Enforcement & Invariants

- **Zero Cross-Layer Leaks:**
  - Only `backend/src/config/prisma.js` imports `@prisma/client`.
  - Only `frontend/src/api/client.js` executes `fetch()`.
  - No controllers contain Prisma queries.
  - No services touch Express `req` or `res` objects.
- **Workflow Governance:**
  - Rule 1: Cross-user modification forbidden (403 Forbidden).
  - Rule 2: Duplicate recurring engagement rejected (409 Conflict).
  - Rule 3: Illegal state transitions rejected (400 Bad Request).
  - Rule 4: Review approval transitions task to completed (200 OK).
  - Rule 5: Anti-self-approval strictly enforced (403 Forbidden).
