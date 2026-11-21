# Submodule 05: Government Approvals, Master Layout & RERA Compliance

## 1. Overview & Objectives
Before construction or pre-launch marketing in CRM can begin, projects must acquire statutory sanctions from governmental, environmental, municipal, and town planning bodies.

The **Government Approvals & Town Planning** module manages:
1. **Change of Land Use (CLU)** (Agricultural $\rightarrow$ Residential/Commercial).
2. **Master Layout Plan Sanction** from Town & Country Planning / Urban Development Authority.
3. **Statutory NOCs** (Pollution Control Board, Fire Safety, Airport Authority, Forest Buffer).
4. **RERA Registration** and mandatory quarterly compliance filings.

---

## 2. Key Capabilities & Workflow

```
CLU Conversion ──> Master Layout Sanction ──> Multi-Department NOCs ──> RERA Registration
```

### 2.1 Change of Land Use (CLU) Tracker
- Tracks application filing, revenue demand note payments, inspection by District Land Conversion Committee, and receipt of official CLU sanction order.

### 2.2 Master Layout Plan & Architectural Drawings
- Master Plan upload: Road hierarchy (60ft, 40ft, 30ft), green spaces/parks, community centers, utility substations.
- Version control for revised drawings (Revision A, B, C) with timestamped change logs.

### 2.3 Statutory NOC Registry
Checklist and tracking for mandatory clearances:
- State Pollution Control Board (Consent to Establish - CTE).
- Ground Water Authority / Water Supply Board clearance.
- Fire Safety Provisional NOC.
- High-Tension Electricity Board (JVVNL/DISCOM) load feasibility.

### 2.4 RERA Compliance Engine
- Registration Number, Date of Grant, and Expiry Date.
- Dedicated bank account tracking for RERA escrow (70% project collections deposit rule).
- Quarterly progress update reminders (Q-returns).

---

## 3. Data Schema Specifications

```javascript
// GovernmentApproval Entity
{
  approvalId: "APP-2026-004",
  projectId: "PRJ-EMERALD-VALLEY",
  cluDetails: {
    orderNumber: "CLU/JAIPUR/2026/89",
    conversionFeePaid: 4200000,
    sanctionDate: "2026-06-12T00:00:00.000Z",
    status: "approved"
  },
  layoutSanction: {
    authority: "Jaipur Development Authority (JDA)",
    sanctionNumber: "JDA/BPC/2026/1420",
    totalPlotsApproved: 140,
    sanctionDate: "2026-07-20T00:00:00.000Z",
    layoutDocumentUrl: "/uploads/approvals/layout-sanctioned-v2.pdf"
  },
  nocChecklist: [
    { department: "State Pollution Control Board", status: "cleared", validTill: "2029-06-30" },
    { department: "Fire & Emergency Services", status: "cleared", validTill: "2027-07-15" },
    { department: "Airport Authority of India", status: "cleared", heightPermittedMeters: 45 },
    { department: "Electricity DISCOM (Power NOC)", status: "cleared", sanctionedKVA: 500 }
  ],
  reraDetails: {
    reraNumber: "RAJ/P/2026/3412",
    validFrom: "2026-08-01T00:00:00.000Z",
    validTill: "2029-12-31T00:00:00.000Z",
    escrowAccountNumber: "HDFC-RERA-901284"
  }
}
```

---

## 4. Responsive UI & Interface Breakdown

- **NOC Compliance Grid:**
  - Dynamic cards showing Authority Name, Status (Cleared / Applied / Pending), Expiry Warning Pill, and View Document link.
  - Mobile: Full-width stacked cards with quick filter chips: `All`, `Pending`, `Expiring Soon`.
- **RERA Escrow Indicator:**
  - Visual summary card indicating compliance with RERA escrow 70% rule.

---

## 5. Security & Configuration Implementation
- Endpoints: `GET /api/v1/pms/approvals`, `POST /api/v1/pms/approvals`, `PUT /api/v1/pms/approvals/:id/noc`.
- Configuration handled via `backend/src/config/index.js`.
