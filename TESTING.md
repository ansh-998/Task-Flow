# TaskFlow — Comprehensive Testing Guide (TESTING.md)

This document provides complete instructions for executing, demonstrating, and explaining all tests for the **TaskFlow** platform. It covers **automated integration tests**, **live API tests via curl**, **database validation**, and an **interview demonstration script**.

---

## 1. Quick Test Execution (Automated Suite)

TaskFlow includes an automated integration test suite built with **Vitest** and **Supertest**. Tests run against mock and serverless PostgreSQL environments using deterministic fixtures.

### Run All Tests
```bash
cd backend
npm test
```

### Run Tests in Watch Mode (Interactive Development)
```bash
cd backend
npm run test:watch
```

### Run a Single Test Suite
```bash
cd backend
npx vitest run tests/self-approval.test.js
```

---

## 2. Automated Test Suite Matrix (21 Passing Tests)

The 21 tests are partitioned across 7 dedicated test files to thoroughly validate the system against every business rule:

| Test File | Tests | Core Rule Validated | Expected Status |
|---|:---:|---|:---:|
| **`self-approval.test.js`** | 2 | **Rule 5: Anti-Self-Approval**<br>Assignee cannot approve their own deliverable in `ready_for_review` | `403 Forbidden` |
| **`duplicate-recurring.test.js`** | 1 | **Rule 2: Idempotent Periods**<br>Attempting to create a duplicate engagement for same client & period returns conflict | `409 Conflict` |
| **`invalid-transition.test.js`** | 1 | **Rule 3: State Machine Validation**<br>Illegal state jumps (e.g. `not_started` directly to `completed`) are blocked | `400 Bad Request` |
| **`unauthorized-task-update.test.js`** | 1 | **Rule 1: Cross-User Isolation**<br>Team Member cannot modify tasks assigned to other members | `403 Forbidden` |
| **`manager-approval.test.js`** | 1 | **Rule 4: Manager Approval**<br>Designated Reviewer / Manager approves submitted task | `200 OK` &rarr; `completed` |
| **`auth-and-users.test.js`** | 12 | **RBAC & User Management**<br>Admin privileges, password hashing with bcrypt, JWT signing, client creation | `200`, `201`, `401`, `403` |
| **`business-scenario.test.js`** | 3 | **Business Workflow**<br>Recurring vs one-time engagements, template task cloning, review lifecycle | `200 OK`, `201 Created` |

---

## 3. Live API Testing via curl (Interactive Verification)

To test against the live running backend, open two terminal windows.

### Terminal 1: Start Backend Server
```bash
cd backend
npm run dev
```
*(Server listens at `http://localhost:4000`)*

---

### Terminal 2: Execute Test Scenarios

### Scenario A: Health Check
```bash
curl http://localhost:4000/api/health
```
**Expected Response:**
```json
{"status":"ok","timestamp":"2026-09-17T..."}
```

---

### Scenario B: Authentication & Token Retrieval

#### 1. Login as Administrator (Alice)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@taskflow.local","password":"password123"}'
```

#### 2. Login as Manager (Bob)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@taskflow.local","password":"password123"}'
```

#### 3. Login as Team Member (Evan)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"evan@taskflow.local","password":"password123"}'
```

*Save the returned `token` from any of the responses to an environment variable for testing:*
```bash
# Windows PowerShell:
$TOKEN="<paste_jwt_token_here>"

# macOS / Linux Bash:
export TOKEN="<paste_jwt_token_here>"
```

---

### Scenario C: Role-Based Access Control (RBAC) Testing

#### 1. Non-Admin Attempts to Create a Client (Should Return 403 Forbidden)
```bash
# Logged in as Evan (Team Member)
curl -i -X POST http://localhost:4000/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacker LLC","code":"HACK","contactEmail":"hacker@test.com"}'
```
**Expected Status:** `HTTP/1.1 403 Forbidden`
```json
{"error":"Forbidden: Insufficient role permissions"}
```

#### 2. Admin Creates a Client (Should Return 201 Created)
```bash
# Logged in as Alice (Admin)
curl -i -X POST http://localhost:4000/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pioneer Ventures","code":"PIO","contactEmail":"ops@pioneer.com"}'
```
**Expected Status:** `HTTP/1.1 201 Created`

---

### Scenario D: Task State Machine & Workflow Transitions

#### 1. Retrieve Current Tasks
```bash
curl http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

#### 2. Valid Transition: Move Task from `not_started` &rarr; `in_progress`
```bash
curl -i -X PATCH http://localhost:4000/api/tasks/<TASK_ID>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","comment":"Started documentation review"}'
```
**Expected Status:** `HTTP/1.1 200 OK` (Status updated, `TaskActivity` audit logged)

#### 3. Invalid Transition: Attempt Illegal Jump `not_started` &rarr; `completed`
```bash
curl -i -X PATCH http://localhost:4000/api/tasks/<TASK_ID>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```
**Expected Status:** `HTTP/1.1 400 Bad Request`
```json
{"error":"Invalid workflow transition"}
```

---

### Scenario E: Anti-Self-Approval Rule Verification

#### 1. Submit Work for Review (Assignee moves status to `ready_for_review`)
```bash
curl -i -X PATCH http://localhost:4000/api/tasks/<TASK_ID>/status \
  -H "Authorization: Bearer $ASSIGNEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready_for_review","comment":"Ready for review"}'
```
**Expected Status:** `HTTP/1.1 200 OK`

#### 2. Assignee Tries to Approve Their Own Work (Must Return 403 Forbidden)
```bash
curl -i -X POST http://localhost:4000/api/tasks/<TASK_ID>/review \
  -H "Authorization: Bearer $ASSIGNEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision":"approve","comment":"Self-approving"}'
```
**Expected Status:** `HTTP/1.1 403 Forbidden`
```json
{"error":"Cannot approve own work"}
```

#### 3. Designated Manager / Reviewer Approves Work (Returns 200 OK)
```bash
curl -i -X POST http://localhost:4000/api/tasks/<TASK_ID>/review \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision":"approve","comment":"Calculations verified and accurate"}'
```
**Expected Status:** `HTTP/1.1 200 OK` (Status updated to `completed`)

---

### Scenario F: Recurring Generation & Idempotency Check

Trigger recurring generation for all active recurring clients:
```bash
curl -i -X POST http://localhost:4000/api/engagements/generate-recurring \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```
**Expected Response:**
```json
{
  "success": true,
  "summary": {
    "processed": 5,
    "created": 0,
    "skipped": 5,
    "errors": 0
  }
}
```
*Notice that `skipped` equals 5. Because the period already exists, PostgreSQL's composite unique constraint `@@unique([clientId, serviceTypeId, periodKey])` guarantees no duplicate records are generated.*

---

## 4. Frontend & User Interface Verification

### Start the Frontend Dev Server
```bash
cd frontend
npm run dev
```
*(Open browser at `http://localhost:5173`)*

### Test Flow Checklist:
1. **Login Page**:
   - Log in with `alice@taskflow.local` / `password123`.
   - Verify redirect to `/` (Dashboard).
2. **Dashboard**:
   - Verify the 5 KPI metric cards: **Total Open Tasks**, **Overdue Tasks**, **Due Today**, **Waiting on Client**, **Pending Review**.
   - Test the "All Tasks" vs "My Tasks" view toggle.
3. **Engagements Page**:
   - Verify recurring vs one-time badges.
   - Click the **`↻ Generate Next Period`** button in the header; observe the toast/notification detailing created vs skipped cycles.
4. **Task Drawer**:
   - Click on any task in the table.
   - Verify slide-over drawer displays Client, Assignee, Reviewer, Due Date, and Audit Trail history.
   - Perform a transition (e.g. "Start Work &rarr;"); verify instant badge update and audit log record.
5. **Role Restrictions**:
   - Log out and log in as `evan@taskflow.local` (Team Member).
   - Verify the Admin sidebar items (Users, Services, Templates) are hidden.
   - Try navigating directly to `http://localhost:5173/admin/users`; verify redirection to `/unauthorized`.

---

## 5. Interview Demonstration Cheat Sheet

When presenting your solution in an interview or technical evaluation, follow this 4-step sequence:

### Step 1: Automated Tests (15 seconds)
* Run `npm test` in the `backend/` directory.
* Say: *"All 21 integration tests pass across 7 test files, testing the HTTP layer, JWT authorization, and all 5 core business invariants."*

### Step 2: Show Anti-Self-Approval in Code & Terminal (45 seconds)
* Point to [backend/src/services/task.service.js](file:///c:/ANSH/Coding/WEB/Startup%20Movers/TaskFlow/backend/src/services/task.service.js#L196):
  ```javascript
  if (user.id === task.assigneeId) {
    throw new AppError('Cannot approve own work', 403);
  }
  ```
* Explain: *"Even if a manager is assigned to do the work on a task, they cannot approve themselves. It requires a separate reviewer or administrator."*

### Step 3: Explain Database Concurrency & Idempotency (45 seconds)
* Point to [backend/prisma/schema.prisma](file:///c:/ANSH/Coding/WEB/Startup%20Movers/TaskFlow/backend/prisma/schema.prisma):
  ```prisma
  @@unique([clientId, serviceTypeId, periodKey])
  ```
* Explain: *"Our background recurring generator runs safely. Even if two background jobs trigger simultaneously, the database constraint prevents duplicate deliverables and returns HTTP 409."*

### Step 4: Show the Live UI & Dashboard (1 minute)
* Show the 5 KPI cards on the dashboard.
* Click **`↻ Generate Next Period`** on the Engagements page.
* Open a task drawer to demonstrate the real-time audit log.
