# Submodule 01: PMS Executive Dashboard & Interactive Stage Rail

## 1. Overview & Objectives
The **PMS Executive Dashboard** provides leadership, project directors, and site managers with a unified overview of all ongoing real estate projects. It displays high-level KPIs, critical milestone delays, open approval gates, and an interactive **13-Stage Lifecycle Rail** showing project maturity.

---

## 2. Key Capabilities & Functionality

### 2.1 Interactive 13-Stage Rail
- Visual stepper showing the exact stage of the selected project:
  1. *Land Scouting* $\rightarrow$ 2. *Legal Due Diligence* $\rightarrow$ 3. *Purchase & Registry* $\rightarrow$ 4. *Town Planning & Approvals* $\rightarrow$ 5. *Pre-Site & Tendering* $\rightarrow$ 6. *Baseline Lock* $\rightarrow$ 7. *Civil Construction (DPR)* $\rightarrow$ 8. *Quality Inspection* $\rightarrow$ 9. *Contractor Billing* $\rightarrow$ 10. *Handover*.
- Stage gates are color-coded:
  - **Completed (Emerald):** All mandatory prerequisites verified and signed off.
  - **In Progress (Brand Blue):** Current active operational workspace.
  - **Pending / Locked (Slate):** Cannot advance until prerequisite gate approvals are granted.
  - **Attention Required (Amber / Rose):** Flagged due to legal disputes, cost overruns, or critical schedule delays.

### 2.2 Executive KPI Tiles
- **Active Projects:** Total ongoing townships and villa developments.
- **Land Under Acquisition:** Total area (in Acres and Bighas) undergoing feasibility or legal checks.
- **DPR Compliance Rate (%):** Percentage of active sites that successfully submitted their daily reports today before the 6:00 PM cutoff.
- **Open Snags / Punch List Items:** Critical quality defects awaiting contractor rectification.
- **Pending Approvals Gate:** High-value requisitions, Change Requests (CR), and legal sign-offs awaiting management clearance.
- **Budget Variance (Planned vs Actual):** Real-time financial variance percentage.

### 2.3 Critical Delay Radar & Fast-Track Actions
- Live alert feed highlighting bottlenecks (e.g., *"Site Visit Pending > 48 Hours"*, *"Baseline Change Request Awaiting Director Approval"*, *"Legal Case Missing Encumbrance Certificate"*).
- Direct one-click navigation pills linking to the respective resolution modal.

---

## 3. Data Schema & Contracts

```javascript
// PmsProject Dashboard Summary
{
  projectId: "PRJ-GREEN-VALLEY-01",
  projectName: "Green Valley Residency Phase 1",
  location: "Sector 88, Express Corridor",
  currentStage: 7, // Stage 7: Construction Execution & DPR
  stageStatus: "on_track", // on_track | delayed | blocked
  targetCompletionDate: "2027-12-31T00:00:00.000Z",
  metrics: {
    totalPlotsOrVillas: 140,
    unitsConstructed: 48,
    laborOnSiteToday: 112,
    plannedBudget: 450000000, // ₹45.0 Cr
    actualSpent: 182000000,   // ₹18.2 Cr
    variancePercentage: -2.4  // within tolerance
  },
  stages: [
    { stageNumber: 1, name: "Land Acquisition", status: "completed", completedAt: "2026-02-10" },
    { stageNumber: 2, name: "Legal Verification", status: "completed", completedAt: "2026-03-05" },
    // ... stages 3 to 13
  ]
}
```

---

## 4. Responsive UI & Layout Specification

- **Mobile Viewports (<640px):**
  - KPI tiles display in 2 columns (`grid-cols-2`).
  - Stage rail collapses into a horizontal swipeable pill bar (`flex overflow-x-auto no-scrollbar py-2`).
  - Project cards show primary status chip and action button full-width (`w-full`).
- **Tablet Viewports (768px – 1024px):**
  - KPI tiles display in 3 columns (`grid-cols-3`).
  - Project metrics and stage progression stack in a 2-column grid.
- **Desktop (1280px+):**
  - KPI tiles span all 6 columns (`xl:grid-cols-6`).
  - Full 13-stage interactive Gantt/rail with tooltips and clickable stage transition gates.

---

## 5. Security & Configuration Implementation
- **Configuration:** No hardcoded API paths or secrets. The dashboard fetches summary data via the centralized API client: `getProjectOverview()` using endpoints derived from `config.apiPrefix`.
- **RBAC:**
  - *Directors & PMs:* Full visibility into financial budgets, variance, and advance-stage override gates.
  - *Site Engineers:* Scoped strictly to assigned active construction projects with financial budget amounts hidden.
