# TaskFlow Production Deployment Guide
## Render (Backend API) + Vercel (Frontend SPA) + Neon (PostgreSQL)

This guide provides step-by-step instructions to deploy **TaskFlow** to production using:
- **Database**: [Neon](https://neon.tech) (Serverless PostgreSQL with connection pooling)
- **Backend API**: [Render](https://render.com) (Node.js Express + Prisma ORM + node-cron)
- **Frontend SPA**: [Vercel](https://vercel.com) (React 18 + Vite + Single Page Application)

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │            Internet / Users             │
                      └────────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
       ┌─────────────────────────┐                   ┌─────────────────────────┐
       │   Vercel (Frontend)     │                   │     Render (Backend)    │
       │   React 18 + Vite SPA   │─── HTTPS REST ───▶│   Node.js + Express API │
       │   your-app.vercel.app   │    API Calls      │ your-api.onrender.com   │
       └─────────────────────────┘                   └────────────┬────────────┘
                                                                  │
                                                        Prisma ORM (Pooled)
                                                                  │
                                                                  ▼
                                                     ┌─────────────────────────┐
                                                     │    Neon PostgreSQL      │
                                                     │  ep-xyz-pooler.neon.tech│
                                                     └─────────────────────────┘
```

---

## Deployment Flow & Order

To avoid circular configuration issues (the frontend needs the backend URL, and the backend needs the frontend URL for CORS), follow this deployment order:

```
Step 1: Provision Neon PostgreSQL Database
                     │
                     ▼
Step 2: Deploy Backend API on Render (with temporary open CORS)
                     │
                     ▼
Step 3: Run Database Migrations & Initial Seed on Render
                     │
                     ▼
Step 4: Deploy Frontend SPA on Vercel (pointing to Render API URL)
                     │
                     ▼
Step 5: Lock Down CORS in Render (set CLIENT_ORIGIN to Vercel URL)
                     │
                     ▼
Step 6: End-to-End Verification & Smoke Test
```

---

## Step 1: Database Provisioning (Neon PostgreSQL)

TaskFlow uses PostgreSQL via Prisma. Neon is recommended because it provides native PgBouncer connection pooling and zero-maintenance serverless scaling.

### 1.1 Create your Neon Project
1. Log in to [Neon Console](https://console.neon.tech).
2. Click **New Project**.
3. Set:
   - **Project Name**: `taskflow-prod`
   - **Region**: Choose the region closest to where you will deploy Render (e.g. `US East (Ohio)` or `Europe (Frankfurt)`).
4. Click **Create Project**.

### 1.2 Obtain Both Connection Strings
Neon displays connection details on the project dashboard. You need **two** distinct connection URLs:

1. **Pooled Connection String (`DATABASE_URL`)**:
   - Check the **Connection pooling** toggle.
   - The URL will contain `-pooler` (e.g., `ep-taskflow-pooler.us-east-2.aws.neon.tech`).
   - Copy this value. This handles all runtime web requests efficiently.

2. **Direct Connection String (`DIRECT_URL`)**:
   - Uncheck the **Connection pooling** toggle.
   - The URL will NOT contain `-pooler` (e.g., `ep-taskflow.us-east-2.aws.neon.tech`).
   - Copy this value. This is required by Prisma for DDL migrations (`prisma migrate deploy`).

> **Important**: Always verify both connection strings end with `?sslmode=require`.

---

## Step 2: Backend API Deployment on Render

### 2.1 Create a Web Service on Render
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your TaskFlow repository.
4. Configure the service settings:

| Setting | Value | Explanation |
|---|---|---|
| **Name** | `taskflow-api` (or your choice) | Identifies your service; forms your URL (`https://taskflow-api.onrender.com`) |
| **Region** | Match your Neon region | E.g. `Ohio (US East)` or `Frankfurt (EU Central)` to minimize latency |
| **Branch** | `main` | Production Git branch |
| **Root Directory** | `backend` | **Critical**: Tells Render to run commands inside the `backend/` folder |
| **Runtime** | `Node` | Execution environment |
| **Build Command** | `npm install && npm run build && npm run migrate:deploy` | Installs dependencies, generates Prisma Client, and applies database migrations |
| **Start Command** | `npm run start` | Runs `node src/index.js` |
| **Plan Type** | Free or Starter | Free tier spins down after 15 min of inactivity; Starter stays active |

### 2.2 Configure Backend Environment Variables
In the **Environment Variables** section on Render, add the following keys:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations & standard HTTP access logging |
| `PORT` | `4000` | Port for Express listener (Render sets `PORT` automatically, but setting 4000 ensures consistency) |
| `DATABASE_URL` | `<Neon Pooled Connection String>` | From Step 1.2 (contains `-pooler`) |
| `DIRECT_URL` | `<Neon Direct Connection String>` | From Step 1.2 (unpooled direct endpoint) |
| `JWT_SECRET` | `<32+ character random string>` | Generate securely with `openssl rand -hex 32` |
| `CLIENT_ORIGIN` | `*` *(temporary)* | Set to `*` initially during first build; you will replace this with your Vercel URL in Step 5 |
| `INTERNAL_SECRET` | `<random-secret-token>` | Secures the automated cron endpoint (`/api/internal/run-recurring`) |

### 2.3 Set Health Check Path
Scroll down to **Advanced** settings:
- **Health Check Path**: `/health`

### 2.4 Deploy
Click **Create Web Service**.
Render will:
1. Clone the repository.
2. Enter the `backend` directory.
3. Run `npm install`.
4. Run `npm run build` (`prisma generate`).
5. Run `npm run migrate:deploy` (applies all schema migrations to Neon).
6. Run `npm run start` and wait for `/health` to respond with `HTTP 200 OK`.

Copy your Render URL once active (e.g. `https://taskflow-api.onrender.com`).

---

## Step 3: Seed Initial Database Records

To populate the database with default admin/manager accounts, service types, and initial templates:

### Method A: Via Render Shell (Recommended)
1. In your Render service dashboard, click the **Shell** tab on the left menu.
2. Run the seed script:
   ```bash
   npm run seed
   ```
3. You will see output confirming created users (`admin@taskflow.dev`, `sarah.manager@taskflow.dev`, etc.) and default service blueprints.

### Method B: One-Time Build Command Run
If Shell access is unavailable on your plan, temporarily append `&& npm run seed` to your Render Build Command:
```bash
npm install && npm run build && npm run migrate:deploy && npm run seed
```
Trigger a deploy, then remove `&& npm run seed` from the build command once completed.

---

## Step 4: Frontend SPA Deployment on Vercel

TaskFlow includes `frontend/vercel.json` pre-configured with client-side rewrites to prevent 404 errors when refreshing deep links.

### 4.1 Create Project on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your TaskFlow GitHub repository.
4. In the **Configure Project** screen:
   
| Setting | Value | Notes |
|---|---|---|
| **Framework Preset** | `Vite` | Vercel will auto-detect Vite |
| **Root Directory** | `frontend` | Click **Edit**, select `frontend`, and click **Continue** |
| **Build Command** | `npm run build` | Default Vite build (`vite build`) |
| **Output Directory** | `dist` | Default Vite build output folder |

### 4.2 Configure Frontend Environment Variables
Expand the **Environment Variables** accordion and add:

| Key | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` | Paste your Render backend URL from Step 2.4 (do NOT add a trailing slash) |

### 4.3 Deploy
Click **Deploy**.
Vercel will build the frontend bundle and assign a production domain (e.g. `https://taskflow-frontend.vercel.app`).
Copy your Vercel production URL.

---

## Step 5: Lock Down CORS on Render

Now that your frontend domain is known, close the temporary `*` CORS wildcard on the backend:

1. Return to the [Render Dashboard](https://dashboard.render.com).
2. Open your `taskflow-api` Web Service and navigate to **Environment**.
3. Edit the `CLIENT_ORIGIN` variable:
   ```env
   CLIENT_ORIGIN=https://your-frontend.vercel.app
   ```
   *(Optional: You can allow both your Vercel production domain and local development simultaneously by using a comma-separated list:)*
   ```env
   CLIENT_ORIGIN=https://your-frontend.vercel.app,http://localhost:5173
   ```
4. Click **Save Changes**. Render will automatically redeploy the backend with the new CORS restrictions.

---

## Step 6: Automated Recurring Tasks (Cron) in Production

TaskFlow has a built-in recurrence engine in `backend/src/cron/recurring.js` set to run daily at 02:00 UTC.

### Handling Render Free Tier (Sleep Mode)
If you are on Render's Free tier, the service spins down after 15 minutes of inactivity. When asleep, internal Node.js `node-cron` timers will not fire.

To guarantee daily recurring task generation on the Free tier:
1. Go to [cron-job.org](https://cron-job.org) (or use GitHub Actions / EasyCron).
2. Create a free scheduled daily job:
   - **URL**: `https://your-backend.onrender.com/api/internal/run-recurring`
   - **Method**: `POST`
   - **Schedule**: Daily at `02:00 UTC`
   - **Headers**:
     - `x-internal-secret`: The exact value you set for `INTERNAL_SECRET` in Render.
     - `Content-Type`: `application/json`
3. This external ping wakes the Render instance and reliably triggers recurring deliverables generation.

---

## Step 7: Production Smoke Test Checklist

Execute these checks to confirm full system operation:

| # | Test | Procedure | Expected Outcome |
|:---:|---|---|---|
| 1 | **API Health Probe** | Visit `https://your-backend.onrender.com/health` in browser | Returns `{"status":"ok","timestamp":"..."}` with HTTP 200 |
| 2 | **Frontend Load** | Visit `https://your-frontend.vercel.app` | Login page loads cleanly with TaskFlow branding and demo login buttons |
| 3 | **Authentication** | Click **Admin** (or sign in with `admin@taskflow.dev` / `password123`) | Authenticates, stores JWT, redirects to Dashboard |
| 4 | **SPA Deep Linking** | Navigate to `/engagements`, then press **Ctrl+F5** (Hard Refresh) | Page reloads without a 404 error (handled by `vercel.json`) |
| 5 | **CORS Handshake** | Open browser DevTools Network tab, trigger an action (e.g. view `/clients`) | Request headers show `Origin: https://your-frontend.vercel.app`; response headers include `Access-Control-Allow-Origin` |
| 6 | **Business Workflow** | Open a task in **Dashboard**, click **Start Work**, then **Submit for Review** | State changes smoothly and is recorded in the Activity Log |
| 7 | **Anti-Self-Approval** | Assign a task to yourself, submit it for review, and try to approve it | Warning banner displays: *"Anti-Self-Approval: Assignee cannot approve own work"* |

---

## Environment Variables Quick Reference

### Render Environment (`backend`)
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://neondb_owner:password@ep-xyz-pooler.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=generate_with_openssl_rand_hex_32
CLIENT_ORIGIN=https://your-app.vercel.app
INTERNAL_SECRET=generate_strong_secret_for_cron
```

### Vercel Environment (`frontend`)
```env
VITE_API_URL=https://your-api.onrender.com
```

---

## Common Troubleshooting

### 1. CORS Error: `Not allowed by CORS` (HTTP 403)
- **Cause**: The `CLIENT_ORIGIN` in Render does not match your Vercel URL.
- **Fix**: Check your Vercel domain. Make sure it includes `https://` and does **not** contain a trailing slash (e.g., `https://my-app.vercel.app`, NOT `https://my-app.vercel.app/`).

### 2. Page Refresh Returns 404 on Vercel
- **Cause**: Vercel is looking for a physical directory instead of routing through `index.html`.
- **Fix**: Ensure `frontend/vercel.json` exists with the rewrite rule:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### 3. Database Connection Timeout on Render
- **Cause**: `DATABASE_URL` is using the direct endpoint instead of the pooled connection.
- **Fix**: Verify `DATABASE_URL` contains `-pooler` in its hostname and uses port `6543` or `5432` with `?sslmode=require`.

### 4. Render Build Fails on `prisma migrate deploy`
- **Cause**: `DIRECT_URL` is missing or points to the pooled endpoint.
- **Fix**: Ensure `DIRECT_URL` is configured in Render pointing to the direct (non-pooler) Neon connection string.

### 5. Render Free Tier Cold Start Delay
- **Symptom**: First request after 15 minutes of inactivity takes 30-50 seconds to respond.
- **Explanation**: Render Free tier spins down inactive containers. Once woken, performance is normal.
- **Fix**: Use a free monitoring service like [UptimeRobot](https://uptimerobot.com) to ping `https://your-api.onrender.com/health` every 10 minutes to keep the container warm.