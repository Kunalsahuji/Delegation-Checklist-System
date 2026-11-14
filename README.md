# TaskFlow ERP — Delegation & Checklist Management System

[![Live Frontend](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel&logoColor=white)](https://delegation-checklist-system.vercel.app/)
[![Live Backend API](https://img.shields.io/badge/Backend%20API-Live%20on%20Render-blue?style=for-the-badge&logo=render&logoColor=white)](https://delegation-checklist-system.onrender.com/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kunalsahuji/Delegation-Checklist-System)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)

A full-stack, enterprise-grade operational management ERP built specifically for **Delegation Task Tracking**, **Recurring Operational Checklists**, **Weekly Analytics & Target Planning**, and **Organizational Role Administration**.

---

## 🌐 Live Deployments

- 🚀 **Live Web Application (Frontend):** [https://delegation-checklist-system.vercel.app/](https://delegation-checklist-system.vercel.app/)
- ⚡ **Live REST API (Backend):** [https://delegation-checklist-system.onrender.com/](https://delegation-checklist-system.onrender.com/)
- 🩺 **API Health Check Endpoint:** [https://delegation-checklist-system.onrender.com/health](https://delegation-checklist-system.onrender.com/health)
- 📦 **GitHub Source Code:** [https://github.com/Kunalsahuji/Delegation-Checklist-System](https://github.com/Kunalsahuji/Delegation-Checklist-System)

### 🔑 Demo Login Credentials
- **Email:** `admin@company.com`
- **Password:** `admin123`
*(Manager and Employee demo profiles available in system)*

---

## 🏗️ System Architecture & Tech Stack

```
Delegation-Checklist-System/
├── backend/                  # Node.js + Express REST API Server (Render)
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
├── frontend/                 # React 19 + Vite + Tailwind CSS SPA (Vercel)
│   ├── public/               # Favicon & branding assets
│   ├── src/
│   │   ├── layouts/          # Responsive App Shell (Fixed Sidebar, TopBar, Drawer)
│   │   ├── modules/
│   │   │   ├── checklist/    # Workspace (Items to tick + Setup), Dashboard, Weekly Report
│   │   │   └── delegation/   # Workspace (Delegation list), Dashboard, Weekly RYG Report
│   │   ├── pages/            # Unified Dashboard, Departments, Employees & Roles, Login
│   │   └── api/              # Axios HTTP client with JWT interceptors
│   ├── vercel.json           # SPA rewrite routing rules
│   └── package.json
│
└── render.yaml               # Infrastructure-as-code Blueprint for Render
```

### Core Technologies
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v7, Axios.
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose ODM), Joi validation, JWT, Dayjs, Winston logger, Helmet, CORS.
- **Hosting & Infrastructure:** Vercel (Frontend SPA), Render (Backend Web Service), MongoDB Atlas (Cloud Database).

---

## ✨ Key Operational Features

### 1. Recurring Checklist Management
- **Recurrence Engine:** Daily, Weekly, Monthly, and Last Weekday of Month intervals.
- **Workday Exclusions:** Automated exclusion of Sundays and public holidays with rolling preview.
- **Occurrence Lifecycle:**
  - One-click completion (`done`) with instant audit timestamps.
  - Skip functionality with mandatory reason logging.
  - Overdue tracking with progress remarks and estimated completion dates.
  - Seamless re-assignment of occurrences to other team members.
- **Dual Workspace View:** Segmented toggle between **Items to Tick** and **Checklist Setup Drawer**.

### 2. Delegation Task Tracking
- **Deadline Integrity:** Immutable `originalDueDate` permanently logged at task creation.
- **Date Revision Audit:** Full history of extensions (`newDueDate`, mandatory `reason`, `kind`, `revisedBy`).
- **Real-Time Urgency Slices:** Filter by All, Today, Pending, Overdue, Week Shifted, Completed, Follow-up Due.
- **Multi-Level Priority:** High, Medium, and Low task prioritization.

### 3. Weekly Reports & Compliance Matrices
- **Checklist Weekly Report:** "% Work Not Done" performance per team member with interactive next-week planned target persistence.
- **Delegation Weekly Report:** Red / Yellow / Green (0 revisions / 1 revision / 2+ revisions) compliance distribution with print and CSV export capability.

### 4. Executive Unified Dashboard
- Real-time aggregation of operational KPIs across both Workspaces.
- Quick navigation shortcuts into Checklist, Delegation, Departments, and Employee directories.

### 5. Industry-Standard Ergonomics & UX
- Fixed application shell (`h-screen overflow-hidden`) with independent scroll panes.
- Viewport-anchored left sidebar with interactive floating bottom profile menu.
- Full mobile/tablet responsiveness (drawer overlay, responsive KPI cards, touch-friendly inputs).
- Dynamic, resilient CORS policy supporting production domains, preview branches, and local environments.

---

## ⚙️ Environment Variables

### Backend (`backend/.env` / Render Dashboard)

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server listening port | `10000` (Render) / `5080` (Local) |
| `API_PREFIX` | Base REST API route | `/api/v1` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/tangdi-uat` |
| `JWT_ACCESS_SECRET` | Secret key for access token signing | `your_access_secret_key` |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | `your_refresh_secret_key` |
| `JWT_ACCESS_EXPIRES_IN` | Lifespan of access tokens | `1d` |
| `JWT_REFRESH_EXPIRES_IN`| Lifespan of refresh tokens | `7d` |
| `COOKIE_SECRET` | Signing secret for session cookies | `your_cookie_secret_key` |
| `CORS_ORIGIN` | Allowed cross-origin domains | `https://delegation-checklist-system.vercel.app,http://localhost:5185` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `CRON_ENABLED` | Automated recurrence materialization | `true` |

### Frontend (`frontend/.env` / Vercel Dashboard)

| Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Live backend API URL | `https://delegation-checklist-system.onrender.com/api/v1` |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas cluster URI or local MongoDB instance

### 2. Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kunalsahuji/Delegation-Checklist-System.git
   cd Delegation-Checklist-System
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and secrets
   npm run dev
   # API running at http://localhost:5080 (Health check: http://localhost:5080/health)
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   npm run dev
   # Web app running at http://localhost:5185
   ```

---

## 📊 Automated Verification Test Suites

```bash
cd backend

# Delegation Engine & Date Revision Verification
node scripts/verify_delegation_backend.js

# Weekly Reports & Executive Analytics Verification
node scripts/verify_phase4_reports.js

# Excel Migration Pipeline & Historical Data Verification
node scripts/verify_phase5_migration.js

# End-to-End Handover & SLA Performance Benchmark (25/25 Tests)
node scripts/verify_phase6_handover.js
```

---

## 📖 API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service uptime and health check |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT |
| `GET` | `/api/v1/checklist/tasks` | List checklist task definitions |
| `POST` | `/api/v1/checklist/tasks` | Create recurring checklist task |
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

---

## 🤝 Connect with Me
📦 GitHub: [github.com/Kunalsahuji](https://github.com/Kunalsahuji)  
🔗 LinkedIn: [linkedin.com/in/kunalsahuji](https://www.linkedin.com/in/kunalsahuji)  
📌 Notion: [Watch my content](https://www.notion.so/1dff7c6ce1bb803787fbddd34e422ab4?v=1e0f7c6ce1bb8052b14c000cb57448ee&pvs=4)  
📧 Email: [ksahu0103@gmail.com](mailto:ksahu0103@gmail.com)  

---

## 🙌 Acknowledgements
Developed with ❤️ by [Kunal Sahu](https://github.com/Kunalsahuji).
