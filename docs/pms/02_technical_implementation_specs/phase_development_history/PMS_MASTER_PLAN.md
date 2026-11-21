# TaskFlow ERP — PMS (Project Management System) Master Plan

## 1. System Vision & Enterprise Scope

The **Project Management System (PMS)** is the operational engine of the real estate enterprise. It bridges the gap between **Land Scouting/Acquisition**, **Government Approvals**, **Civil Construction Execution**, and **CRM Sales Handover**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TASKFLOW ERP ENTERPRISE SUITE                     │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│  PMS (DEVELOPMENT)  │   CRM (SALES & BUYERS)    │ OPERATIONS & SOPs    │
│  Land & Legal       │   Enquiries & Leads       │ Recurring Checklists │
│  Baseline & Budget  │   Site Visits & Deals     │ Assigned Tasks       │
│  Construction & DPR │   Broker Network          │ Weekly Compliance    │
└─────────────────────┴───────────────────────────┴──────────────────────┘
```

---

## 2. Core Architectural & Engineering Directives

### 2.1 Configuration Management ("No Raw ENV in Codebase" Policy)
To guarantee security, maintainability, and zero production breakages across Vercel, VPS, and Docker:
1. **Never read `process.env` directly in controllers, services, or models:** All environment lookups are centralized strictly in `backend/src/config/index.js` with documented fallback defaults.
2. **Never expose secrets to client builds:** Frontend configuration uses Vite runtime proxies (`/api/v1`) or unified API helper abstractions (`frontend/src/services/api.js`). No direct `import.meta.env` scattering in UI components.
3. **Graceful Degraded Mode:** If an optional config (e.g., third-party SMS, external S3 storage) is omitted, the system falls back gracefully to internal mock/storage handlers without crashing the application bootloader.

### 2.2 Responsive UI & Cross-Device Standard
PMS is designed for heterogeneous devices:
- **Mobile Phones (375px – 640px):** Site Engineers submitting DPRs on cellular networks in dusty construction sites; quick photo upload, large touch tap targets ($\ge 44\text{px}$), swipeable cards, single-column forms, sticky submit actions.
- **Tablets (768px – 1024px):** Project Managers and Architects reviewing drawings, inspection punch lists, and measurement sheets on iPad/Android tablets.
- **Desktops / Laptops (1280px – 1920px+):** Management and Accounts teams analyzing Gantt baselines, financial variances, and multi-stage approval rails.

**Enforced Layout Rules:**
- All data tables wrap with `.overflow-x-auto` and auto-collapse into card stacks (`block sm:table`, `hidden sm:table-row`) on viewports $<640\text{px}$.
- KPI grids scale dynamically: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`.
- Modals scale with `max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto w-full p-4 sm:p-6`.

---

## 3. System Architecture & Entity Relationship Diagram

```
                 ┌─────────────────────────────────┐
                 │       PmsProject (Parent)       │
                 │  - Code, Name, Location, Status │
                 │  - 13 Lifecycle Stages Rail     │
                 └───────────────┬─────────────────┘
                                 │
         ┌───────────────────────┼────────────────────────┐
         ▼                       ▼                        ▼
┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────┐
│     LandPlot     │   │ ProjectBaseline  │   │  ConstructionProject  │
│ - Survey / Bigha │   │ - BOQ Materials  │   │  - Phases & Milestones│
│ - GPS Polygon    │   │ - Planned Labour │   │  - Work Packages      │
│ - Landowner Info │   │ - Budget Cap     │   │  - Contractor Master  │
└────────┬─────────┘   │ - Baseline Lock  │   └───────────┬───────────┘
         │             └──────────────────┘               │
         ▼                                                ▼
┌──────────────────┐                           ┌─────────────────────┐
│    LegalCase     │                           │  ConstructionDpr    │
│ - 4 Check Stages │                           │  - Daily Labour Log │
│ - Title & EC     │                           │  - Material Consumed│
│ - Advocate Op.   │                           │  - Geo-Tagged Photos│
└────────┬─────────┘                           └──────────┬──────────┘
         │                                                │
         ▼                                                ▼
┌──────────────────┐                           ┌─────────────────────┐
│  LandPurchase    │                           │  QualitySnag / MB   │
│ - Registry & Sale│                           │  - Snag Lifecycle   │
│ - Revenue Record │                           │  - RA Bill & Cert.  │
└──────────────────┘                           └─────────────────────┘
```

---

## 4. Phased Implementation Roadmap

| Phase | Module Name | Scope & Deliverables | Primary User Persona |
| :--- | :--- | :--- | :--- |
| **Phase 01** | **PMS Foundation & Stage Rail** | Global Project catalog, 13-stage interactive lifecycle rail, project overview KPIs, role switcher. | Director / Project Manager |
| **Phase 02** | **Land Acquisition & Feasibility** | Plot registry, survey details, GPS bounds, market rate comparison, financial feasibility calculator, "Approved Plot Package". | Land Acquisition Officer |
| **Phase 03** | **Legal Verification Engine** | Handoff from Plot, 4-stage legal review (Title, EC, Revenue, Advocate Opinion), document vault, PM approval gate. | Legal Counsel / Advocate |
| **Phase 04** | **Land Purchase & Registry** | Agreement to sell, payment milestones, registry execution tracker, revenue mutation (Dakhil-Kharij). | Land & Legal Officer |
| **Phase 05** | **Government Approvals & Town Planning**| CLU (Change of Land Use), master layout sanction, Fire/PCB NOCs, RERA compliance register. | Liaisoning Officer |
| **Phase 06** | **Contractors & Pre-Site Setup** | Contractor master, trade categorization, Work Orders (WO), milestone terms, retention money, site water/power setup. | Project Manager |
| **Phase 07** | **Baseline Planning & Lock** | BOQ breakdown (Civil, MEP, Infrastructure), planned material schedule, planned budget cap, **Immutable Baseline Lock & Change Request (CR) workflow**. | Chief Engineer / PM |
| **Phase 08** | **Construction Execution & DPR** | **Daily Progress Report (DPR)** (mobile-first, <90s submission), daily labor headcount, material usage, geo-stamped photos. | Site Engineer |
| **Phase 09** | **Quality Control & Snag Lifecycle** | Phase-wise inspection checklist, Snag ticket lifecycle (Raise $\rightarrow$ Contractor Assign $\rightarrow$ Rectify $\rightarrow$ Close). | Quality Inspector |
| **Phase 10** | **Contractor Measurement & RA Billing**| Measurement Book (MB) entries, Running Account (RA) bills, deductions (TDS, GST, retention), engineer certification. | Billing Engineer / Accounts |
| **Phase 11** | **Handover & Post-Construction** | Completion/Occupancy Certificate, final deep clean, joint customer walkthrough, possession letter, DLP warranty tickets. | Handover Manager / CRM |

---

## 5. Role-Based Access Control (RBAC) Matrix

| Module / Action | Director / CEO | Project Manager | Site Engineer | Legal Executive | Billing / Accounts |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View PMS Dashboard** | Full | Full | Assigned Project | Project Legal | Financials Only |
| **Plot Scouting & Feasibility** | Approve | Manage | No Access | Read Only | Review |
| **Legal Verification & Opinion**| Final Gate | Review | No Access | Manage / Sign | No Access |
| **Baseline Approval & Lock** | Final Gate | Manage | No Access | No Access | Review |
| **Submit Daily DPR** | Read | Review/Sign | **Create / Edit** | No Access | Read |
| **Raise / Close Quality Snags** | Read | Review | **Manage** | No Access | No Access |
| **Approve Contractor RA Bills** | Final Payout | Technical Sign | Measurements | No Access | **Calculate & Disburse** |
| **Customer Handover** | Review | Authorize | Inspect | NOC Sign | Final Dues NOC |

---

## 6. Directory Structure & Documentation Navigation

```
docs/pms/
├── PMS_MASTER_PLAN.md               ← (This Document) Overall Architecture & Standards
├── PMS_FLOW_EXPLAINER.md            ← Plain-English Business Flow & Terminology
├── 01_EXECUTIVE_DASHBOARD_STAGE_RAIL.md
├── 02_LAND_ACQUISITION_FEASIBILITY.md
├── 03_LEGAL_VERIFICATION.md
├── 04_LAND_PURCHASE_REGISTRY.md
├── 05_GOVT_APPROVALS_PLANNING.md
├── 06_PRE_SITE_CONTRACTORS.md
├── 07_BASELINE_PLANNING.md
├── 08_CONSTRUCTION_DPR.md
├── 09_QUALITY_CONTROL_SNAGS.md
├── 10_CONTRACTOR_BILLING_MB.md
├── 11_HANDOVER_MANAGEMENT.md
└── diagrams/
    ├── 01_END_TO_END_LIFECYCLE_FLOW.md
    ├── 02_LAND_ACQUISITION_LEGAL_GATEWAY.md
    ├── 03_DAILY_PROGRESS_REPORT_DPR_FLOW.md
    ├── 04_CONTRACTOR_MEASUREMENT_BILLING_FLOW.md
    └── 05_QUALITY_SNAG_RESOLUTION_FLOW.md
```
