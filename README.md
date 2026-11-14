# TaskFlow ERP — Delegation & Checklist Management System

A full-stack, enterprise-grade operational management ERP built specifically for **Delegation Tracking**, **Recurring Operational Checklists**, **Weekly Analytics & Target Planning**, and **Organizational Role Administration**.

---

## 1. System Architecture & Tech Stack

```
Delegation-Checklist-System/
├── backend/                  # Node.js + Express REST API Server (Port 5080)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # JWT Authentication, Password Hashing, RBAC
│   │   │   ├── master/       # Departments, Projects, Users & Roles
│   │   │   ├── checklist/    # Task definitions, recurrence engine, occurrence materialisation
│   │   │   └── delegation/   # Delegation lifecycle, immutable original due dates, revisions
│   │   ├── database/         # MongoDB connection & idempotent master seeds
│   │   ├── scripts/          # Excel migration pipeline & automated verification test suites
│   │   ├── cron/             # Scheduled rolling occurrence materialisation
│   │   └── server.js         # HTTP server entrypoint
│   └── package.json
│
├── frontend/                 # React 18 + Vite + Tailwind CSS SPA (Port 5185)
│   ├── src/
│   │   ├── layouts/          # Responsive App Shell (Fixed Sidebar, TopBar, Drawer)
│   │   ├── modules/
│   │   │   ├── checklist/    # Workspace (Items to tick + Setup), Dashboard, Weekly Report
│   │   │   └── delegation/   # Workspace (Delegation list), Dashboard, Weekly RYG Report
│   │   ├── pages/            # Unified Dashboard, Departments, Employees & Roles, Login
│   │   └── api/              # Axios HTTP client with JWT interceptors
│   └── package.json
│
└── docs/                     # Architectural specifications and phase checklists (Phases 1-6)
```

### Core Technologies
- **Backend:** Node.js, Express.js, MongoDB (Mongoose ODM), Joi validation, JWT, Dayjs.
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Database:** MongoDB (`tangdi-uat`).

---

## 2. Key Operational Features

### A. Recurring Checklist Management
- **Recurrence Engine:** Supports Daily, Weekly, Monthly, and Last Weekday of the Month frequencies.
- **Workday Exclusions:** Automated exclusion of Sundays and public holidays with rolling preview.
- **Occurrence Lifecycle:**
  - `pending` -> `done` (completed inline with timestamps).
  - `skipped` with mandatory explanation remarks.
  - `overdue` tracking and progress notes with expected completion dates.
  - Occurrence re-assignment to team members with reason history.
- **Workspace Views:** Quick segmented toggle between **Items to Tick** and **Checklist Setup**.

### B. Delegation Task Tracking
- **Deadline Integrity:** Immutable `originalDueDate` recorded at task creation; never overwritten.
- **Date Revision Audit:** Full history of extensions (`newDueDate`, `reason`, `kind`, `revisedBy`).
- **Urgency Slices:** Filter by All, Today, Pending, Overdue, Week Shifted, Completed, Follow-up Due.
- **Multi-Level Priority:** High, Medium, Low task prioritization.

### C. Weekly Reports & Compliance Matrix
- **Checklist Weekly Report:** "% Work Not Done" performance per team member with interactive next-week planned target persistence.
- **Delegation Weekly Report:** Red / Yellow / Green (0 revisions / 1 revision / 2+ revisions) compliance distribution with print and CSV export capability.

### D. Industry-Standard Ergonomics & UX
- Fixed-height application shell (`h-screen overflow-hidden`) with independent scrolling.
- Left sidebar remains anchored in the viewport; user profile permanently pinned at the bottom.
- 100% responsive across mobile (320px–375px), tablet (768px), and wide desktop screens.

---

## 3. Getting Started & Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB instance running locally or on network (e.g. `mongodb://localhost:27017/tangdi-uat`)

### Setup Instructions

1. **Clone repository and enter project directory:**
   ```bash
   cd E:\FullStack_Domination\d-table-analytics\Delegation-Checklist-System
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Ensure `.env` contains:
   ```env
   PORT=5080
   MONGODB_URI=mongodb://localhost:27017/tangdi-uat
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Running the Application:**
   - **Backend Server:**
     ```bash
     cd backend && npm run dev
     # Server listening on http://localhost:5080 (Health: http://localhost:5080/api/v1/health)
     ```
   - **Frontend Development Server:**
     ```bash
     cd frontend && npm run dev
     # Client accessible on http://localhost:5185
     ```

5. **Default Credentials:**
   - **Email:** `admin@company.com`
   - **Password:** `admin123`

---

## 4. Database Seeding & Migration

To import historical Excel workbooks into MongoDB with full idempotent safety:

```bash
cd backend
# Execute Excel migration pipeline:
node src/scripts/importExcelWorkbooks.js
```
*Imports 7 Departments, 24 Users, 71 Checklist Definitions (1,621 occurrences), and 2,407 Delegation Tasks (1,311 with date revisions).*

---

## 5. Automated Verification Suites

Each development phase includes automated verification suites:

```bash
cd backend

# Phase 3: Delegation Core Engine Verification
node scripts/verify_delegation_backend.js

# Phase 4: Reports, Analytics & Executive Dashboard Verification
node scripts/verify_phase4_reports.js

# Phase 5: Excel Migration Pipeline & Historical Data Seed Verification
node scripts/verify_phase5_migration.js

# Phase 6: End-to-End Handover & Performance SLA Verification (25 Tests)
node scripts/verify_phase6_handover.js
```

---

## 6. API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT |
| `GET` | `/api/v1/checklist/tasks` | List checklist task definitions |
| `POST` | `/api/v1/checklist/tasks` | Create new recurring checklist task |
| `POST` | `/api/v1/checklist/tasks/preview` | Preview upcoming recurrence schedule |
| `GET` | `/api/v1/checklist/occurrences` | Filter checklist occurrences |
| `GET` | `/api/v1/checklist/occurrences/stats`| Aggregate checklist KPI metrics |
| `PATCH`| `/api/v1/checklist/occurrences/:id/status`| Update status (done / skipped) |
| `GET` | `/api/v1/delegation` | Filter delegation tasks |
| `POST` | `/api/v1/delegation` | Create new delegation task |
| `GET` | `/api/v1/delegation/stats` | Aggregate delegation KPI metrics |
| `POST` | `/api/v1/delegation/:id/revise` | Log date extension with mandatory reason |
| `PATCH`| `/api/v1/delegation/:id/status` | Mark delegation completed or cancelled |
| `GET` | `/api/v1/checklist/report/weekly` | Compute weekly % work not done report |
| `GET` | `/api/v1/delegation/report/weekly`| Compute weekly Red/Yellow/Green report |
| `GET` | `/api/v1/master/departments` | Fetch active operational departments |
| `GET` | `/api/v1/master/users` | Fetch active employees and role permissions |
