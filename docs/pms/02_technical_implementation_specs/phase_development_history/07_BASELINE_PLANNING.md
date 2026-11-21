# Submodule 07: Baseline Planning & Immutable Baseline Lock Engine

## 1. Overview & Objectives
Without an unchangeable reference baseline, **Planned-vs-Actual** tracking is meaningless. If project teams could freely edit planned quantities whenever steel prices increase or work is delayed, real financial variance would be completely masked.

The **Baseline Planning & Immutable Baseline Lock Engine** guarantees project integrity:
1. Translates architectural designs into a formal **Bill of Quantities (BOQ)**.
2. Freezes planned material schedules, labor requirements, milestone dates, and cost budgets.
3. Enforces the **Immutable Baseline Lock**: Once signed off by the Managing Director, all baseline figures become strictly read-only.
4. Any subsequent budget expansion requires a formal, audited **Change Request (CR)** with mandatory business justification and approval audit trails.

---

## 2. Key Capabilities & Workflow

```
Draft BOQ & Schedules ──> Director Approval ──> BASELINE LOCKED (Immutable)
                                                       │
                                            (Unforeseen Variance)
                                                       │
                                                       ▼
                                            Submit Change Request (CR)
                                                       │
                                            Director Sign-Off / Audit
```

### 2.1 Bill of Quantities (BOQ) Breakdown
Hierarchical categorization:
- **Civil Structural:** Cement (bags), Rebar TMT Steel (Metric Tons), Aggregates & Sand (Truckloads/Cu.m), Bricks (Nos).
- **Infrastructure:** Bitumen road paving, Stormwater RCC hume pipes, Sewage Chambers, Streetlight poles & cabling.
- **Labor Budget:** Planned mason-days, helper-days, shuttering carpenter days.

### 2.2 Baseline Approval & Immutable Lock
- When the engineering budget is finalized, the Chief Project Engineer submits the baseline for approval.
- Upon Director approval:
  - `isBaselineLocked` flips to `true`.
  - Timestamp, Director User ID, and cryptographic hash of the baseline items are recorded.
  - UI converts all baseline input fields to read-only text with lock badge icons (`🔒 Baseline Locked`).

### 2.3 The Change Request (CR) Governance Workflow
If an unavoidable scope change occurs (e.g., client requests a community club enhancement, or sub-surface rock excavation requires blasting):
- Project Engineer submits a **Change Request (CR)**.
- Fields required:
  - *Reason Category:* Scope Addition | Geological Surprise | Market Inflation | Statutory Requirement.
  - *Detailed Justification:* Explanation of why the baseline must be altered.
  - *Cost Impact:* $\pm \Delta \text{ Amount in INR}$.
  - *Timeline Impact:* $\pm \Delta \text{ Days to Completion}$.
- Managing Director reviews the CR. If approved, the system logs Revision 1 (`Baseline Rev 1.01`) while preserving the historical original baseline for lifetime audit analysis.

---

## 3. Data Schema Specifications

```javascript
// ProjectBaseline Entity
{
  baselineId: "BSL-2026-004",
  projectId: "PRJ-EMERALD-VALLEY",
  revision: "1.00",
  isLocked: true,
  lockedAt: "2026-08-15T12:00:00.000Z",
  lockedBy: "USR-DIR-001",
  budgetSummary: {
    plannedCivilBudget: 28000000,
    plannedInfrastructureBudget: 12000000,
    plannedElectricalBudget: 5000000,
    totalPlannedCapital: 45000000 // ₹4.50 Cr
  },
  boqMaterials: [
    { itemCode: "MAT-CEMENT-OPC53", name: "OPC 53 Cement", unit: "Bags", plannedQty: 18000, plannedRate: 380, plannedTotal: 6840000 },
    { itemCode: "MAT-STEEL-FE550D", name: "TMT Rebar Fe550D", unit: "Metric Tons", plannedQty: 140, plannedRate: 58000, plannedTotal: 8120000 }
  ],
  changeRequests: [
    {
      crNumber: "CR-001",
      submittedBy: "USR-PM-002",
      reasonCategory: "scope_addition",
      justification: "Additional underground rain harvesting sump added per municipality directive.",
      costImpactINR: 650000,
      daysImpact: 14,
      status: "approved", // pending | approved | rejected
      approvedBy: "USR-DIR-001",
      approvedAt: "2026-09-01T15:00:00.000Z"
    }
  ]
}
```

---

## 4. Responsive UI & Interface Breakdown

- **BOQ Baseline Table:**
  - Displays Planned Qty, Planned Rate, Planned Total, and Current Consumed.
  - Mobile: Clean summary cards showing Planned vs. Actual progress bars with color-coded variance tags (`emerald` within tolerance, `rose` overrun).
- **Change Request Drawer:**
  - Accessible via a prominent "Request Baseline Change" button.
  - Form validation requires both cost impact and justification text before submission.

---

## 5. Security & Configuration Implementation
- Endpoints: `GET /api/v1/pms/baseline/:projectId`, `POST /api/v1/pms/baseline/:projectId/lock`, `POST /api/v1/pms/baseline/:projectId/change-request`.
- Configuration handled via `backend/src/config/index.js`.
- Security rule: Backend rejection (`403 Forbidden`) if any request attempts to modify a locked baseline without an approved Change Request.
