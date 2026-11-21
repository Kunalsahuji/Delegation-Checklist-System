# Section 01: CRM Dashboard & Analytics

## 1. Overview
The CRM Dashboard provides an executive command center for leadership and a focused daily cockpit for sales representatives. It visualizes the end-to-end sales funnel, conversion velocity, team performance, and pending operational tasks.

---

## 2. Core Functional Requirements
- **Top KPI Metric Cards**:
  - Total Inquiries
  - Pending Qualification
  - Active Pipeline Leads
  - Site Visits Conducted
  - Closed Won Deals
  - Overall Conversion Rate (%)
- **Interactive Funnel Chart**:
  - Shows conversion progression: *Inquiry → Qualified → Visit Confirmed → Site Visit Done → Negotiation → Won*.
- **Team vs. "My Data" View**:
  - Executives with admin/manager roles can toggle between company-wide numbers and their personal portfolio.
  - Standard sales reps automatically see only their assigned deals and tasks.
- **Top Performers Recognition**:
  - Highlights top closers and visit achievers of the week/month to incentivize sales velocity.
- **Source Breakdown Widget**:
  - Distribution chart showing where business originates: *Meta Ads, Walk-in, Broker Reference, Direct Call, Website*.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/dashboard/kpis` — Aggregate counts, filtered by date range and ownership.
- `GET /api/v1/crm/dashboard/funnel` — Step-by-step conversion volumes and drop-off percentages.
- `GET /api/v1/crm/dashboard/source-stats` — Volume and revenue breakdown by lead source.
- `GET /api/v1/crm/dashboard/team-leaderboard` — Ranking of representatives by visits logged and deals won.

---

## 4. UI/UX Elements
- Unified `WorkKpiStrip` with our standard `MetricInfoBadge` on each KPI explaining what it measures and how it is calculated.
- Clean Tailwind cards with responsive mobile grids.
- Quick date-range selector (*Today, This Week, This Month, Custom Range*).
