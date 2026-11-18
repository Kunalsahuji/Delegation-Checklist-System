# TaskFlow ERP — Operations, Delegation & Real Estate CRM System

[![Live Frontend](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel&logoColor=white)](https://delegation-checklist-system.vercel.app/)
[![Live Backend API](https://img.shields.io/badge/Backend%20API-Live%20on%20Render-blue?style=for-the-badge&logo=render&logoColor=white)](https://delegation-checklist-system.onrender.com/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kunalsahuji/Delegation-Checklist-System)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)

A full-stack, enterprise-grade business management ERP combining three core operational pillars:
1. **Recurring Operational Checklists (SOPs):** Automated recurrence rules, holiday exclusions, occurrence lifecycle, and weekly performance compliance.
2. **Delegation Task Tracking:** Task assignment with strict original due dates, date revision logs, and Red/Yellow/Green scoring.
3. **Real Estate CRM & Sales Pipeline:** End-to-end buyer journey across an 8-Stage conversion funnel, GPS-verified site tours, automated follow-up radar, Meta lead sync, and an 8-tier channel partner broker hierarchy.

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
│   │   │   ├── delegation/   # Delegation lifecycle, immutable original due dates, revisions
│   │   │   └── crm/          # Real Estate CRM: Enquiries, Leads, Funnel, Visits, Brokers, Meta
│   │   ├── database/         # MongoDB Atlas connection & master seeds
│   │   ├── scripts/          # Excel migration pipeline & automated verification test suites
│   │   ├── cron/             # Scheduled rolling occurrence materialisation
│   │   └── server.js         # HTTP server entrypoint
│   └── package.json
│
├── frontend/                 # React 19 + Vite + Tailwind CSS SPA (Vercel)
│   ├── public/               # Favicon & branding assets
│   ├── src/
│   │   ├── layouts/          # Responsive App Shell (Fixed Sidebar, TopBar, Mobile Drawer)
│   │   ├── modules/
│   │   │   ├── checklist/    # Workspace (Items to tick + Setup), Dashboard, Weekly Report
│   │   │   ├── delegation/   # Workspace (Delegation list), Dashboard, Weekly RYG Report
│   │   │   └── crm/          # CRM Dashboard, Enquiries, 8-Stage Leads, Visits, Brokers, Hierarchy
│   │   ├── pages/            # Unified Dashboard (Bar/Donut Charts), Departments, Employees, Login
│   │   └── api/              # Axios HTTP client with JWT interceptors
│   ├── vercel.json           # SPA rewrite routing rules
│   └── package.json
│
├── docs/                     # Architecture blueprints & operational manuals
│   └── submodules-flow-guide/# Complete 12 CRM submodules guide with Mermaid flowcharts
└── render.yaml               # Infrastructure-as-code Blueprint for Render
```

### Core Technologies
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v7, Axios.
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose ODM), Joi validation, JWT, Dayjs, Winston logger, Helmet, CORS.
- **Hosting & Infrastructure:** Vercel (Frontend SPA), Render (Backend Web Service), MongoDB Atlas (Cloud Database).

---

## ✨ Key Enterprise Pillars & Features

### 1. Recurring Checklist Management (Operational SOPs)
- **Recurrence Engine:** Daily, Weekly, Monthly, and Last Weekday of Month intervals.
- **Workday Exclusions:** Automated exclusion of Sundays and public holidays with rolling preview.
- **Occurrence Lifecycle:**
  - One-click completion (`done`) with instant audit timestamps.
  - Skip functionality with mandatory reason logging.
  - Overdue tracking with progress remarks and estimated completion dates.
  - Seamless re-assignment of occurrences to other team members.
- **Dual Workspace View:** Segmented toggle between **Items to Tick** and **Checklist Setup Drawer**.
- **Weekly Performance Matrix:** "% Work Not Done" metrics with interactive next-week planned targets.

### 2. Delegation Task Tracking (Assigned Work & Deadlines)
- **Deadline Integrity:** Immutable `originalDueDate` permanently logged at task creation.
- **Date Revision Audit:** Full history of extensions (`newDueDate`, mandatory `reason`, `kind`, `revisedBy`).
- **Real-Time Urgency Slices:** Filter by All, Today, Pending, Overdue, Week Shifted, Completed, Follow-up Due.
- **Multi-Level Priority:** High, Medium, and Low task prioritization.
- **Red / Yellow / Green Scoring:** 0 revisions (Green) / 1 revision (Yellow) / 2+ revisions (Red) weekly compliance distribution.

### 3. Real Estate CRM & Sales Automation
- **8-Stage Sales Pipeline Funnel:**
  - `S1`: Call For Visit Confirmation By Sales Co-ordinator
  - `S2`: WhatsApp & Email Confirmation Message to Clients
  - `S3`: Remind Call By Telesales
  - `S4`: Visit Confirmed & Ready
  - `S5`: Feedback Call by Sales Co-ordinator
  - `S6`: Follow-Up Call By Sales Person
  - `S7`: Call For Negotiation and Family Visit
  - `S8`: Call For Final Deal & Closing
- **Inbound Lead Intake & Qualification:** Multi-channel lead intake across Meta ads, phone calls, walk-ins, websites, and broker referrals with budget verification.
- **Lead Assignment Desk:** Fair workload balancing, round-robin dispatch, reassignments, and transfer logs.
- **Field Site Visits (GPS Verified):** On-site client tour management with latitude/longitude geo-fencing validation, entry gate logs, and buyer unit preferences.
- **Follow-up & Reminder Radar:** Overdue tracking, Due Today alerts, Starred VIP triage, and automated notifications.
- **8-Tier Channel Partner (Broker) Pyramid:** Cumulative square yardage milestone hierarchy (Bronze to Chairman/AD) and commission slab tracking.
- **Meta Leads Holding Area:** Real-time Facebook and Instagram lead sync, staging review, and CRM release.
- **CRM Calendar & Bulk Broadcast:** Month/week agenda for client appointments and targeted SMS/WhatsApp communications.
- 📘 *Detailed documentation and Mermaid diagrams available in [`docs/submodules-flow-guide/`](./docs/submodules-flow-guide/README.md).*

### 4. Unified Command Dashboard
- **Cross-Pillar KPI Strip:** Real-time visibility into Checklist items, Delegation tasks, Active CRM leads, Site visits, Broker yards sold, and active staff.
- **Interactive Visual Analytics:**
  - **8-Stage Pipeline Funnel (Bar Chart):** Real-time lead progression from S1 to S8 using Recharts.
  - **Lead Acquisition Channels (Donut Chart):** Inbound marketing channel breakdown with volume and percentage distributions.
- **3 Dedicated Workspace Launchers:** One-click shortcuts into Checklist Operations, Delegation Tasks, and Real Estate CRM.

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

## 📖 API Reference Summary

| Method | Endpoint | Module | Description |
|---|---|---|---|
| `GET` | `/health` | Core | Service uptime and health check |
| `POST` | `/api/v1/auth/login` | Auth | Authenticate user & issue JWT |
| `GET` | `/api/v1/checklist/tasks` | Checklist | List checklist task definitions |
| `POST` | `/api/v1/checklist/tasks` | Checklist | Create recurring checklist task |
| `GET` | `/api/v1/checklist/occurrences` | Checklist | Filter checklist occurrences |
| `PATCH`| `/api/v1/checklist/occurrences/:id/status`| Checklist | Update status (done / skipped) |
| `GET` | `/api/v1/checklist/report/weekly` | Checklist | Compute weekly % work not done report |
| `GET` | `/api/v1/delegation` | Delegation | Filter delegation tasks |
| `POST` | `/api/v1/delegation` | Delegation | Create new delegation task |
| `POST` | `/api/v1/delegation/:id/revise` | Delegation | Log date extension with mandatory reason |
| `PATCH`| `/api/v1/delegation/:id/status` | Delegation | Mark delegation completed or cancelled |
| `GET` | `/api/v1/delegation/report/weekly`| Delegation | Compute weekly Red/Yellow/Green report |
| `GET` | `/api/v1/crm/dashboard` | CRM | Executive CRM analytics & funnel metrics |
| `GET` | `/api/v1/crm/enquiries` | CRM | Inbound enquiries with stage filters |
| `POST` | `/api/v1/crm/enquiries` | CRM | Register inbound property enquiry |
| `GET` | `/api/v1/crm/leads` | CRM | 8-Stage lead pipeline tracking |
| `PATCH`| `/api/v1/crm/leads/:id/stage` | CRM | Advance lead through conversion stages |
| `GET` | `/api/v1/crm/lead-assignments` | CRM | Workload balancing & lead distribution |
| `POST` | `/api/v1/crm/lead-assignments/assign` | CRM | Assign or reallocate leads to sales reps |
| `GET` | `/api/v1/crm/visits` | CRM | Field site visits with GPS status |
| `POST` | `/api/v1/crm/visits` | CRM | Schedule and log GPS verified site tour |
| `GET` | `/api/v1/crm/reminders` | CRM | Operational follow-ups & callbacks |
| `GET` | `/api/v1/crm/special-followups` | CRM | Starred VIP and high-budget follow-ups |
| `GET` | `/api/v1/crm/brokers` | CRM | Channel partner network & yardage |
| `GET` | `/api/v1/crm/brokers/network` | CRM | 8-Tier channel partner sales hierarchy |
| `GET` | `/api/v1/crm/meta-leads` | CRM | Meta Facebook/Instagram lead holding desk |
| `GET` | `/api/v1/master/departments` | Master | Active operational departments |
| `GET` | `/api/v1/master/users` | Master | Active employees and role permissions |

---

## 🤝 Connect with Me
📦 GitHub: [github.com/Kunalsahuji](https://github.com/Kunalsahuji)  
🔗 LinkedIn: [linkedin.com/in/kunalsahuji](https://www.linkedin.com/in/kunalsahuji)  
📌 Notion: [Watch my content](https://www.notion.so/1dff7c6ce1bb803787fbddd34e422ab4?v=1e0f7c6ce1bb8052b14c000cb57448ee&pvs=4)  
📧 Email: [ksahu0103@gmail.com](mailto:ksahu0103@gmail.com)  

---

## 🙌 Acknowledgements
Developed with ❤️ by [Kunal Sahu](https://github.com/Kunalsahuji).
